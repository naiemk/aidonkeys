'use client'

import { Header } from "@/components/header"
import { KingdomState } from "@/components/kingdom-state"
import { NewRewardComponent } from "@/components/new-reward-component"
import { Button } from "@/components/ui/button"
import { EraSummary } from "@/components/era-summary"
import { ContentWithImage } from "@/components/content-with-image"
import Link from "next/link"
import theme from "@/lib/theme"
import Image from "next/image"
import { useConnectWalletSimple, useContracts } from "web3-react-ui"
import { DoubleBorder } from "@/components/double-border"
import { useConfig, useGeneralInfo } from "@/utils/conf"
import { useEffect, useState } from "react"
import { loadMyNfts } from "@/utils/nftload"
import { LoadingButton } from "@/components/ui/loading-button"

export default function Dashboard() {
  const { chainId, address } = useConnectWalletSimple();
  const { validChain, nftContract } = useConfig(chainId);
  const generalInfo = useGeneralInfo();
  const { callMethod } = useContracts();
  const [kings, setKings] = useState<number>(0);
  const [queens, setQueens] = useState<number>(0);
  const [knights, setKnights] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load my collection
    const loadCollection = async () => {
      if (chainId && address && generalInfo.balance && nftContract) {
        setLoading(true);
        try {
          const { rewards } = await loadMyNfts(chainId, nftContract, address, generalInfo.balance, callMethod);
          console.log('rewards', rewards);
          setKings(rewards['KING']?.length || 0);
          setQueens(rewards['QUEEN']?.length || 0);
          setKnights(rewards['KNIGHT']?.length || 0);
        } finally {
          setLoading(false);
        }
      }
    };
    loadCollection();
  }, [chainId, address, callMethod, generalInfo.balance, nftContract]);

  return (
    <div className="min-h-screen flex flex-col items-center">
      <Header />
      <main className="flex-grow p-4 space-y-6 w-full max-w-[950px]">
        {!validChain && <DoubleBorder><div>Invalid chain. Connect to a supported chain.</div></DoubleBorder>}
        {loading && <div className="flex justify-center items-center h-full"><LoadingButton size="lg" loading={true} /></div>}
        {generalInfo.loading && <div>Loading...</div>}
        {generalInfo.error && <DoubleBorder><div className="text-red-500 pb-16">Error: {generalInfo.error}</div></DoubleBorder>}
          <KingdomState kingCount={kings} queenCount={queens} knightCount={knights} />
        {generalInfo.eligibleForRewards && <NewRewardComponent />}

        <EraSummary />

        <ContentWithImage
          leftContent={
            <>
              <h2 style={{ color: theme.text.primary }} className="text-2xl font-bold mb-4">
                Mint New NFT
              </h2>
              <p style={{ color: theme.text.secondary }} className="mb-4">
                Create your own AI-generated NFT with our cutting-edge technology.
              </p>
              <div>
                <Link href="/mint">
                  <Button>Go to Mint Page</Button>
                </Link>
              </div>
            </>
          }
          rightContent={
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/DALL%C2%B7E%202025-01-13%2003.28.45%20-%20A%20playful,%20pixelated%20factory%20scene%20where%20NFTs%20are%20being%20built.%20The%20factory%20should%20have%20robotic%20arms%20assembling%20NFT%20pieces,%20with%20sparks%20and%20lights%20indi-xYlKqzQNz7OgjrYUnhN7V4D6ADdmH5.webp"
              alt="NFT Factory with Robotic Arms"
              fill
              className="object-contain"
              priority
            />
          }
        />

        <ContentWithImage
          leftContent={
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/DALL%C2%B7E%202025-01-13%2003.16.37%20-%20An%208-bit%20style%20flowchart%20graphic%20showing%20how%20users%20interact%20with%20an%20AI%20NFT%20website.%20The%20flow%20should%20be%20clear%20and%20pixelated,%20with%20steps%20that%20users%20can%20-7eBXwOjRcEcloTDU47Uwi8vLHBP40X.webp"
              alt="NFT Creation Process Flowchart"
              fill
              className="object-contain"
              priority
            />
          }
          rightContent={
            <>
              <h2 style={{ color: theme.text.primary }} className="text-2xl font-bold mb-4">
                Collections
              </h2>
              <p style={{ color: theme.text.secondary }} className="mb-4">
                Explore our unique AI-generated NFT collections.
              </p>
              <div>
                <Link href="/collections">
                  <Button>View Collections</Button>
                </Link>
              </div>
            </>
          }
        />
      </main>
    </div>
  )
}

