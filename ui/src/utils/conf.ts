import { GLOBAL_CONFIG } from "@/types/token";
import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { useConnectWalletSimple, useContracts } from "web3-react-ui";

interface AppConfig {
  'supportedChains': string[]
  'nftContracts': {
    [chainId: string]: string
  },
  'eraImages': {
    [eraId: string]: string
  }
}

export interface NftMetadata {
  id: number;
  name: string;
  description: string;
  image: string;
  external_url: string;
  purchaseInfo: {
      id: number;
      telegramId: string;
      purchasePrice: string;
      eraId: string;
      purchaser: string;
      reward: string;
      description: string;
  }
}

export function useConfig(chainId?: string | null): {
  validChain: boolean, nftContract: string, eraImages: { [eraId: string]: string } } {
  const appConfig = GLOBAL_CONFIG['APP'] as AppConfig || {};
  const validChain = appConfig.supportedChains?.includes?.(chainId || '-');
  const nftContract = appConfig.nftContracts?.[chainId || '-'] || '';
  return { validChain, nftContract, eraImages: appConfig.eraImages || {} };
}

export const ABI = {
  totalSupply: 'function totalSupply() external view returns (uint256)',
  balanceOf: 'function balanceOf(address user) external view returns (uint256)',
  getCurrentEraId: 'function getCurrentEraId() external view returns (uint64)',
  currentPriceForEraId: 'function currentPriceForEraId(uint64 eraId) external view returns (uint256)',
  eras: 'function eras(uint eraId) external view returns (uint64  eraId, string  title, uint256 startPrice, uint256 startTimestamp)',
  rewardEligibility: 'function rewardEligibility(address user) external view returns (bool)',
  tokenURI: 'function tokenURI(uint256 tokenId) external view returns (string memory)',
  tokenByIndex: 'function tokenByIndex(uint256 index) external view returns (uint256)',
  tokenOfOwnerByIndex: 'function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)',
  getMintedTokensByEraLength: 'function getMintedTokensByEraLength(uint64 _eraId) external view returns (uint256)',
  getMintedTokensByEra: 'function getMintedTokensByEra(uint64 _eraId, uint256 startIndex, uint256 endIndex) external view returns (uint256[] memory)',
  purchaseMint: 'function purchaseMint(string memory _text, string memory _telegramId) external payable',
  claimReward: 'function claimReward() external',
}

export interface GeneralInfo {
  totalSupply: number;
  rewards: {
    king: number;
    queen: number;
    knight: number;
  },
  currentEra: Era,
  balance: number;
  mintPrice: string;
  mintPriceDisplay: string;
  eligibleForRewards: boolean;
  myTokenIds: number[];
  loading: boolean;
  error: string;
}

export interface Era {
  id: number;
  title: string;
  startPrice: number;
  startPriceDisplay: string;
  startTimestamp: number;
  totalMinted: number;
}

const DEFAULT_GENERAL_INFO: GeneralInfo = {
  totalSupply: 0,
  rewards: {
    king: 0,
    queen: 0,
    knight: 0,
  },
  currentEra: {
    id: 0,
    title: '',
    startPrice: 0,
    startPriceDisplay: '',
    startTimestamp: 0,
    totalMinted: 0,
  },
  balance: 0,
  mintPrice: '',
  mintPriceDisplay: '',
  myTokenIds: [],
  eligibleForRewards: false,
  loading: false,
  error: '',
}

export function useGeneralInfo(): GeneralInfo {
  const { chainId, address } = useConnectWalletSimple();
  const { callMethod } = useContracts();
  const { validChain, nftContract } = useConfig(chainId);
  const [generalInfo, setGeneralInfo] = useState<GeneralInfo>(DEFAULT_GENERAL_INFO);

  useEffect(() => {
    const init = async () => {
      if (!chainId || !nftContract || !address || !validChain) return;
      setGeneralInfo({...generalInfo, loading: true });
      const newInfo = { ...generalInfo, loading: true };
      try {
        const totalSupply = await callMethod(chainId, nftContract, ABI.totalSupply, []);
        newInfo.totalSupply = totalSupply;
        const currentEraId = (await callMethod(chainId, nftContract, ABI.getCurrentEraId, [])).toString();
        newInfo.currentEra.id = currentEraId;
        const currentEra = await callMethod(chainId, nftContract, ABI.eras, [currentEraId]);
        if (!currentEra) return;
        newInfo.currentEra.title = currentEra.title;
        newInfo.currentEra.startPrice = currentEra.startPrice;
        newInfo.currentEra.startTimestamp = currentEra.startTimestamp;
        newInfo.currentEra.startPriceDisplay = ethers.formatEther(currentEra.startPrice);

        const totalMinted = await callMethod(chainId, nftContract, ABI.getMintedTokensByEraLength, [currentEraId]);
        newInfo.currentEra.totalMinted = totalMinted;

        const balance = await callMethod(chainId, nftContract, ABI.balanceOf, [address]);
        newInfo.balance = balance;

        console.log('Current era id', currentEraId);
        const mintPrice = await callMethod(chainId, nftContract, ABI.currentPriceForEraId, [currentEraId]);
        console.log('Mint price', mintPrice);
        // Round up to the 4 decimal place
        const mintPriceRoundUp = (((mintPrice || 0n) / 10n**14n) + 1n) * 10n**14n;
        newInfo.mintPrice = mintPriceRoundUp.toString();
        newInfo.mintPriceDisplay = ethers.formatEther(mintPriceRoundUp);

        const eligibleForRewards = await callMethod(chainId, nftContract, ABI.rewardEligibility, [address]);
        console.log('Eligible for rewards', eligibleForRewards);
        newInfo.eligibleForRewards = eligibleForRewards;

      } catch (error) {
        console.error('Failed to fetch info.', error);
        setGeneralInfo({...generalInfo, error: 'Failed to fetch info.', loading: false });
      } finally {
        setGeneralInfo({...newInfo, loading: false });
      }
    };
    init();
  }, [chainId, address, validChain, nftContract, callMethod]);

  return generalInfo;
}