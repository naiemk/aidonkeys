'use client'

import { useEffect, useState } from 'react'
import { TokenEditor } from '@/components/web3/token-editor'
import { TokenSelectorModal } from '@/components/web3/token-selector-modal'
import { NetworkSelector } from '@/components/web3/network-selector'
import { GLOBAL_CONFIG } from '@/types/token'
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from 'lucide-react'
import { ChainLabel } from '@/components/web3/chain-label'
import { useConnectWalletSimple, getChain, ChainConstants, Token, ApprovableButton, useContracts, useErc20, NATIVE_TOKEN_ADDRESS } from 'web3-react-ui'
import { NetworkSelectorModal } from '@/components/web3/network-selector-modal'
import { findNativeToken, TokenBalances } from '@/components/web3/token-balance'
import { TransactionModal } from '../web3/transaction-modal'
import { ethers, TransactionReceipt } from 'ethers'
import { UnclaimedBalance } from './unclaimed-balance'

interface AppConfig {
  'supportedChains': string[]
  'bridgeContracts': {
    [chainId: string]: string
  }
}

export function TokenEditorSection() {
  const [amount, setAmount] = useState('')
  const { address, chainId} = useConnectWalletSimple();

  // We separate modal from selector, because we want to use the same modal for multiple selectors
  // Token selector
  const [isTokenSelectorOpen, setIsTokenSelectorOpen] = useState(false)
  const [selectedToken, setSelectedToken] = useState<Token | null>(null)
  const [onTokenSelect, setOnTokenSelect] = useState<{selector?: (token: Token) => void}>({})
  // Network selector
  const [isNetworkSelectorOpen, setIsNetowrkSelectorOpen] = useState(false)
  const [selectedNetworkId, setSelectedNetworkId] = useState<string>('');
  const [onNetworkSelect, setOnNetworkSelect] = useState<{selector?: (networkId: string) => void}>({})

  // Transaction modal
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false)
  const [transactionId, setTransactionId] = useState<string | null>(null)

  // Gas check
  const [nativeFee, setNativeFee] = useState(0n)
  const [balances, setBalances] = useState<{[token: string]: bigint}>({})

  const { execute, error } = useContracts();
  const { toMachineReadable, tokenData } = useErc20(selectedToken?.address || '', chainId || '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const chainIds = Object.keys(ChainConstants);
  const tokens = GLOBAL_CONFIG['TOKENS'] as Token[] || []; // This comes from the config file passed in layout...
  const appConfig = GLOBAL_CONFIG['APP'] as AppConfig || {};
  const bridgeContractAddress = appConfig?.['bridgeContracts']?.[chainId || '-'] || null;
  const supportedChains = appConfig?.['supportedChains'] || [];

  const handleNetowrkSelect = (networkId: string) => {
    onNetworkSelect.selector?.(networkId)
    setIsNetowrkSelectorOpen(false)
  }

  const handleTokenSelect = (token: Token) => {
    onTokenSelect.selector?.(token)
    setIsTokenSelectorOpen(false)
  }

  // Clear errors when data changes
  useEffect(() => {
    if (amount && selectedToken && selectedNetworkId) {
      setErrorMessage(null)
    }
  }, [amount, selectedToken, selectedNetworkId])

  useEffect(() => {
    if (chainId) {
      const nativeGas = chainId == '26100' ? BigInt(50000000000000000) : BigInt(100000000000000); // Hardcoded native gas for now
      setNativeFee(nativeGas)
    }
  }, [chainId])

  useEffect(() => {
    if (error) {
      if (typeof error === 'string' && error.includes('ethers-user-denied')) {
        setErrorMessage('User denied transaction')
      } else {
        setErrorMessage(error)
      }
    }
  }, [error])

  useEffect(() => {
    if (!!chainId && !!selectedNetworkId && chainId === selectedNetworkId) {
      console.log('chainId === selectedNetworkId', chainId, selectedNetworkId)
      setSelectedNetworkId('')
      setSelectedToken(null)
    }
  }, [selectedNetworkId, chainId])

  const handleTransactionSubmitted = (tx: TransactionReceipt) => {
    if (tx && tx.hash) {
      setTransactionId(tx.hash)
      setIsTransactionModalOpen(true)
    }
  }

  const handleSwap = async () => {
    if (!tokenData || !bridgeContractAddress || !selectedToken) {
      return;
    }
    setPending(true)
    try {
      const method = 'function swap(uint remoteChainId, address token, uint256 amount, uint256 nativeGas) payable'
      const amountInWei = toMachineReadable(amount)!;
      const totalNative = nativeFee + (selectedToken!.isNative ? amountInWei : 0n)
      const nonNative = selectedToken!.isNative ? 0n : amountInWei
      if (nonNative > balances[selectedToken!.address]) {
        throw new Error(`Insufficient balance for ${selectedToken!.symbol}`)
      }
      if (totalNative > balances[NATIVE_TOKEN_ADDRESS]) {
        throw new Error(`Insufficient balance for ${getChain(chainId!)?.token}`)
      }
      // Handle FRM special case. Ensure value is greater than one if we are bridging FRM to FRM
      console.log('selectedNetworkId', selectedNetworkId, 'selectedToken', selectedToken)
      if (selectedNetworkId == '26100' && selectedToken?.symbol == 'FRM') {
        if (amountInWei < ethers.parseEther('1')) {
          throw new Error(`FRM amount must be greater than 1`)
        }
      }
      console.log('totalNative', totalNative, 'nativeFee', nativeFee, 'amountInWei', amountInWei, 'nonNative', nonNative, 'balances', balances)
      const tx = await execute(bridgeContractAddress!, method, [selectedNetworkId, selectedToken?.address, amountInWei, nativeFee], {
          value: totalNative,
          gasLimit: 5000000
        }
      );
      setAmount('')
      console.log('tx', tx)
      if (tx && tx.hash) {
        setTransactionId(tx.hash)
        setIsTransactionModalOpen(true)
        setErrorMessage(null)
      }
    } catch (e) {
      setErrorMessage((e as Error).message);
      console.log('e', typeof e)
    } finally {
      setPending(false)
    }
  }

  if (chainId && !getChain(chainId!)) {
    return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <div className="bg-card/50 dark:bg-card/10 backdrop-blur-sm rounded-xl p-4 shadow-xl border border-border space-y-4">
        <div className="text-foreground">
          <p>Connected chain not supported</p>
        </div>
      </div>
    </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-4">

      <div className="bg-card/50 dark:bg-card/10 backdrop-blur-sm rounded-xl p-4 shadow-xl border border-border space-y-4">
        {chainId ? <ChainLabel chainId={chainId!} label={`Connected to ${getChain(chainId!)?.label}`} /> :
        <div className="text-foreground">
          <p>Connect your wallet to start swapping</p>
        </div>
        }

        <UnclaimedBalance contractAddress={bridgeContractAddress!} onTransactionSubmitted={handleTransactionSubmitted} />

        <NetworkSelector
          selectedNetworkId={selectedNetworkId}
          label="To (Destination Network)"
          disabled={!supportedChains.includes(chainId!)}
          onOpenModal={() => {
            const selector = (netId: string) => { setSelectedNetworkId(netId); setSelectedToken(null)}
            console.log('selector', selector)
            setOnNetworkSelect({selector});
            setIsNetowrkSelectorOpen(true)
          }}
        />
        
        <div className="space-y-2">
          <TokenEditor
            value={amount}
            onChange={setAmount}
            onTokenSelect={() => {
              setOnTokenSelect({selector: (token: Token) => setSelectedToken(token)});
              setIsTokenSelectorOpen(true)
            }}
            selectedToken={selectedToken}
            disabled={!selectedNetworkId}
          />
          <TokenBalances
            tokens={[selectedToken && !selectedToken.isNative ? selectedToken : null, findNativeToken(chainId!, tokens)]}
            userAddress={address!}
            onBalanceLoaded={(t, balance) => setBalances({...balances, [t.address]: balance})}
          />
        </div>

       {errorMessage && (
            <Alert variant="destructive" className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )} 
        {/* Swap Button */}
        <ApprovableButton
          chainId={chainId!}
          token={selectedToken?.address || ''}
          amount={amount}
          spender={bridgeContractAddress!}
          approveButton={(onApprove, pending) => (<Button 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={onApprove}
                  disabled={pending}
                >
                  Approve {pending ? '...' : ''}
                </Button>)}
          actionButton={
                <Button 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={handleSwap}
                  disabled={pending}
                >
                  Swap {pending ? '...' : ''}
                </Button>}
          unknownState={ <Button 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  disabled={true}
                >
                  Swap
                </Button>}
        />
      </div>

      <TokenSelectorModal
        isOpen={isTokenSelectorOpen}
        onClose={() => setIsTokenSelectorOpen(false)}
        onSelect={handleTokenSelect}
        selectedToken={selectedToken}
        tokens={tokens.filter(token => token.chainId == chainId)}
      />

      <NetworkSelectorModal
        isOpen={isNetworkSelectorOpen}
        onClose={() => setIsNetowrkSelectorOpen(false)}
        onSelect={handleNetowrkSelect}
        networkIds={(chainIds || []).filter(id => id !== selectedNetworkId && id != chainId && supportedChains.includes(id))}
      />

      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        transactionId={transactionId!}
        chainId={chainId!}
      />
    </div>
  )
}

