"use client"
import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { LoadingButton } from "./ui/loading-button"
import theme from "@/lib/theme"
import { NftMetadata } from "@/utils/conf"
import { loadToken } from "@/utils/nftload"

interface NftPlaceholderProps {
  tokenId: string
  chainId: string
  nftContract: string
  address: string
  callMethod: (chainId: string, contract: string, method: string, params: unknown[]) => Promise<unknown>
  collectionSize: number
  index: number
}

type NftState = 'loading' | 'loaded' | 'error'

export function NftPlaceholder({ 
  tokenId, 
  chainId, 
  nftContract, 
  callMethod, 
  collectionSize,
  index 
}: NftPlaceholderProps) {
  const [nft, setNft] = useState<NftMetadata | null>(null)
  const [state, setState] = useState<NftState>('loading')
  const [, setError] = useState<string>('')

  useEffect(() => {
    const loadNft = async () => {
      try {
        setState('loading')
        
        // Calculate random delay based on collection size to prevent rate limiting
        // Base delay of 100ms, plus random delay up to 2 seconds for large collections
        const baseDelay = 100
        const maxRandomDelay = Math.min(2000, collectionSize * 50) // Cap at 2 seconds
        const randomDelay = Math.random() * maxRandomDelay
        const totalDelay = baseDelay + randomDelay
        
        // Add staggered delay based on index to spread out requests
        const staggeredDelay = index * 50
        
        await new Promise(resolve => setTimeout(resolve, totalDelay + staggeredDelay))

        const nftData = await loadToken(chainId, nftContract, tokenId, callMethod);
        setNft(nftData)
        setState('loaded')
      } catch (err) {
        console.error(`Failed to load NFT ${tokenId}:`, err)
        setError(err instanceof Error ? err.message : 'Failed to load NFT')
        setState('error')
      }
    }

    loadNft()
  }, [tokenId, chainId, nftContract, callMethod, collectionSize, index])

  if (state === 'loading') {
    return (
      <Card style={{ backgroundColor: theme.background.secondary, borderRadius: 0 }}>
        <CardContent className="p-2">
          <div className="relative w-full aspect-square mb-2 flex items-center justify-center">
            <LoadingButton size="sm" loading={true} />
          </div>
          <div className="text-xs truncate" style={{ color: theme.text.secondary }}>
            Loading...
          </div>
          <div className="text-xs truncate" style={{ color: theme.text.primary }}>
            NFT #{tokenId}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (state === 'error') {
    return (
      <Card style={{ backgroundColor: theme.background.secondary, borderRadius: 0 }}>
        <CardContent className="p-2">
          <div className="relative w-full aspect-square mb-2 flex items-center justify-center" style={{ backgroundColor: theme.background.primary }}>
            <div className="text-center">
              <div className="text-2xl mb-2">⚠️</div>
              <div className="text-xs" style={{ color: theme.error }}>
                Error
              </div>
            </div>
          </div>
          <div className="text-xs truncate" style={{ color: theme.text.secondary }}>
            Failed to load
          </div>
          <div className="text-xs truncate" style={{ color: theme.text.primary }}>
            NFT #{tokenId}
          </div>
        </CardContent>
      </Card>
    )
  }

  // if (!nft) return null

  return (
    <Link href={`/nft?id=${nft?.id}`}>
      <Card style={{ backgroundColor: theme.background.secondary, borderRadius: 0, cursor: "pointer" }}>
        <CardContent className="p-2">
          <div className="relative w-full aspect-square mb-2">
            <Image
              src={nft?.external_url || nft?.image || "/placeholder.svg"}
              alt={`NFT ${nft?.name}`}
              fill
              className="object-cover"
            />
          </div>
          <div className="text-xs truncate" style={{ color: theme.text.secondary }}>
            Minted by {nft?.purchaseInfo.telegramId?.toString() || 'unnamed'}
          </div>
          <div className="text-xs truncate" style={{ color: theme.text.primary }}>
            {nft?.name}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
