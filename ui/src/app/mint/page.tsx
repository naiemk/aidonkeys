"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { ThemeComponent } from "@/components/theme-component"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DoubleBorder } from "@/components/double-border"
import { Info } from "lucide-react"
import theme from "@/lib/theme"
import { ABI, useConfig, useGeneralInfo } from "@/utils/conf";
import { useConnectWalletSimple, useContracts } from "web3-react-ui"
import { TransactionModal } from "@/components/web3/transaction-modal"

export default function MintPage() {
  const { chainId } = useConnectWalletSimple();
  const [description, setDescription] = useState("");
  const [tgId, setTgId] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const { nftContract } = useConfig(chainId);
  const { execute } = useContracts();
  const generalInfo = useGeneralInfo();

  const mint = async () => {
    if (description.length < 20) {
      setError("Description must be at least 20 characters long");
      return;
    }
    setPending(true);
    try {
      const tx = await execute(nftContract, ABI.purchaseMint, [description, tgId], {
        wait: true,
        value: BigInt(generalInfo.mintPrice) });
      if (tx) {
        setDescription('');
        console.log('tx', tx)
        if (tx && tx.hash) {
          setTransactionId(tx.hash)
          setIsTransactionModalOpen(true)
          setError('')
        }
      }
      console.log({tx});
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow p-4 space-y-6 w-full max-w-[950px] mx-auto">
        <ThemeComponent currentTheme={generalInfo.currentEra.title} />

        <DoubleBorder>
          <div
            style={{
              backgroundColor: theme.card.background,
            }}
            className="p-6"
          >
            <h2 style={{ color: theme.text.primary }} className="text-2xl font-bold mb-4">
              Current Mint Price
            </h2>
            <p style={{ color: theme.text.secondary }} className="text-3xl">
              {generalInfo.mintPriceDisplay} ETH
            </p>
          </div>
        </DoubleBorder>

        <DoubleBorder>
          <div
            style={{
              backgroundColor: theme.card.background,
            }}
            className="p-6"
          >
            <div className="space-y-6">
              {/* Description Section */}
              <div>
                <div className="flex items-center mb-2">
                  <h2 style={{ color: theme.text.primary }} className="text-2xl font-bold mr-2">
                    Describe your design
                  </h2>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info size={20} />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Describe your NFT in detail. Be creative and specific about colors, style, and theme.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 111))}
                  placeholder="Describe your NFT design here..."
                  className="mb-2"
                  disabled={pending}
                  style={{
                    backgroundColor: theme.input.background,
                    color: theme.input.text,
                    borderRadius: 0,
                  }}
                />
                <p style={{ color: theme.text.secondary }} className="text-sm">
                  {description.length}/111 characters
                </p>
              </div>

              {/* Telegram ID Section */}
              <div>
                <div className="flex items-center mb-2">
                  <h2 style={{ color: theme.text.primary }} className="text-2xl font-bold mr-2">
                    Telegram ID
                  </h2>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info size={20} />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Optional: Enter your Telegram ID to receive notifications about your NFT.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  value={tgId}
                  onChange={(e) => setTgId(e.target.value)}
                  placeholder="@yourtelegramid (optional)"
                  className="mb-2"
                  disabled={pending}
                  style={{
                    backgroundColor: theme.input.background,
                    color: theme.input.text,
                    borderRadius: 0,
                  }}
                />
              </div>

              {error && (
                <div
                  className="p-2 text-center"
                  style={{
                    backgroundColor: theme.error,
                    color: theme.text.primary,
                    border: `2px solid ${theme.border.default}`,
                  }}
                >
                  {error}
                </div>
              )}

              <Button size="lg" className="w-full" disabled={!!error || description.length === 0 || pending} onClick={mint}>
                MINT NOW
              </Button>
            </div>
          </div>
        </DoubleBorder>
      </main>
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        transactionId={transactionId!}
        chainId={chainId!}
        message="Minting started with the following transaction. Check back again in a few minutes to see your NFT."
      />
    </div>
  )
}

