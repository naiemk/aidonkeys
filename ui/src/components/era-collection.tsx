import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DoubleBorder } from "@/components/double-border"
import theme from "@/lib/theme"
import { useConnectWalletSimple, useContracts } from "web3-react-ui"
import { Era, NftMetadata, useConfig } from "@/utils/conf"
import { loadEraNfts } from "@/utils/nftload"
import { LoadingButton } from "./ui/loading-button"

const PAGE_SIZE = 16;

interface EraCollectionProps {
  eraId: string;
  era: Era;
}

export function EraCollection({ eraId, era }: EraCollectionProps) {
  const { chainId } = useConnectWalletSimple();
  const [loading, setLoading] = useState(false);
  const { nftContract } = useConfig(chainId);
  const [collection, setCollection] = useState<NftMetadata[]>([]);
  const [eraPage, setEraPage] = useState(0);
  const { callMethod } = useContracts();

  const loadMore = () => {
    loadEra(eraPage + 1);
    setEraPage(eraPage + 1);
  }

  const loadEra = async (page?: number) => {
    if (chainId && nftContract && eraId && callMethod) {
      console.log("Loading era", eraId, eraPage);
      setLoading(true);
      try {
        const nfts = await loadEraNfts(chainId, nftContract, Number(eraId), page || eraPage, PAGE_SIZE, callMethod);
        setCollection([...collection, ...nfts]);
      } finally {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    setCollection([]);
    loadEra();
  }, [chainId, callMethod, nftContract]);

  return (
    <DoubleBorder>
      <div style={{ backgroundColor: theme.card.background }} className="p-4">
        {loading && <div className="flex justify-center items-center h-full"><LoadingButton size="lg" loading={true} /></div>}
        <h2 style={{ color: theme.text.primary }} className="text-2xl font-bold mb-4">
          {eraId} - {era.title} ({era.totalMinted} minted)
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {collection.map((nft) => (
            <Link href={`/nft?id=${nft.id}`} key={nft.id}>
              <Card style={{ backgroundColor: theme.background.secondary, borderRadius: 0, cursor: "pointer" }}>
                <CardContent className="p-2">
                  <div className="relative w-full aspect-square mb-2">
                    <Image
                      src={nft.external_url || "/placeholder.svg"}
                      alt={`NFT ${nft.id}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="text-xs truncate" style={{ color: theme.text.secondary }}>
                    Minted by {nft.purchaseInfo.telegramId || 'unnanmed'}
                  </div>
                  <div className="text-xs truncate" style={{ color: theme.text.primary }}>
                    {nft.name}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        {era.totalMinted > collection.length && (
          <div className="mt-4 text-center">
                <Button onClick={loadMore}>MORE...</Button>
          </div>
        )}
      </div>
    </DoubleBorder>
  )
}

