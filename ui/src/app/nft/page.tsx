'use client'

import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DoubleBorder } from "@/components/double-border"
import theme from "@/lib/theme"
import { useConnectWalletSimple, useContracts } from "web3-react-ui";
import { NftMetadata, useConfig } from "@/utils/conf";
import { useEffect, useState } from "react";
import { loadToken } from "@/utils/nftload";
import { useSearchParams } from "next/navigation"
import { ethers } from "ethers";
export default function NFTItemPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const { chainId } = useConnectWalletSimple();
  const { nftContract } = useConfig(chainId);
  const { callMethod } = useContracts();
  const [nft, setNft] = useState<NftMetadata | null>(null);

  useEffect(() => {
    const load = async () => {
      if (chainId && nftContract && id) {
        const tok = await loadToken(chainId, nftContract, id, callMethod);
        setNft(tok);
      }
    }
    load();
  }, [chainId, nftContract, id, callMethod]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow p-4 w-full max-w-[950px] mx-auto">
        <DoubleBorder>
          <Card
            style={{
              backgroundColor: theme.card.background,
              borderRadius: 0,
            }}
          >
            <CardHeader>
              <CardTitle style={{ color: theme.text.primary }}>NFT #{nft?.id}</CardTitle>
            </CardHeader>
            <CardContent>
              <img
                src={nft?.external_url || "/placeholder.svg"}
                alt={`NFT #${nft?.id}`}
                className="w-full object-cover mb-4"
              />
              <p style={{ color: theme.text.secondary }}>
                <strong>Minted by:</strong> {nft?.purchaseInfo?.telegramId || nft?.purchaseInfo?.purchaser}
              </p>
              <p style={{ color: theme.text.secondary }}>
                <strong>Original Mint Price:</strong> {ethers.formatEther(nft?.purchaseInfo?.purchasePrice || '0')} ETH
              </p>
            </CardContent>
          </Card>
        </DoubleBorder>
      </main>
    </div>
  )
}