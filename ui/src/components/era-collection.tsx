import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DoubleBorder } from "@/components/double-border"
import theme from "@/lib/theme"

interface NFT {
  id: string
  imageUrl: string
}

interface EraCollectionProps {
  era: string
  nfts: NFT[]
}

export function EraCollection({ era, nfts }: EraCollectionProps) {
  const [displayCount, setDisplayCount] = useState(16)

  const loadMore = () => {
    setDisplayCount((prevCount) => Math.min(prevCount + 20, nfts.length))
  }

  return (
    <DoubleBorder>
      <div style={{ backgroundColor: theme.card.background }} className="p-4">
        <h2 style={{ color: theme.text.primary }} className="text-2xl font-bold mb-4">
          {era}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          {nfts.slice(0, displayCount).map((nft) => (
            <Card key={nft.id} style={{ backgroundColor: theme.background.secondary, borderRadius: 0 }}>
              <CardContent className="p-1 sm:p-2">
                <div className="relative w-[100px] h-[100px] sm:w-[150px] sm:h-[150px] md:w-[200] md:h-[200px] mx-auto">
                  <Image src={nft.imageUrl || "/placeholder.svg"} alt={`NFT ${nft.id}`} fill className="object-cover" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {displayCount < nfts.length && (
          <div className="mt-4 text-center">
            <Button onClick={loadMore}>MORE...</Button>
          </div>
        )}
      </div>
    </DoubleBorder>
  )
}

