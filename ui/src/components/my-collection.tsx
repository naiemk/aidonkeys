import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { DoubleBorder } from "@/components/double-border"
import theme from "@/lib/theme"
import { NftMetadata } from "@/utils/conf"

interface MyCollectionProps {
  nfts: NftMetadata[]
}

export function MyCollection({ nfts }: MyCollectionProps) {
  return (
    <DoubleBorder>
      <div style={{ backgroundColor: theme.card.background }} className="p-4">
        <h2 style={{ color: theme.text.primary }} className="text-2xl font-bold mb-4">
          My Collection
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {nfts.map((nft, i) => (
            <Link href={`/nft?id=${nft.id}`} key={i}>
              <Card style={{ backgroundColor: theme.background.secondary, borderRadius: 0, cursor: "pointer" }}>
                <CardContent className="p-2">
                  <div className="relative w-full aspect-square mb-2">
                    <Image
                      src={nft.external_url || "/placeholder.svg"}
                      alt={`NFT ${nft.name}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="text-xs truncate" style={{ color: theme.text.secondary }}>
                    Minted by {nft.purchaseInfo.telegramId?.toString() || 'unnamed'}
                  </div>
                  <div className="text-xs truncate" style={{ color: theme.text.primary }}>
                    {nft.name}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </DoubleBorder>
  )
}

