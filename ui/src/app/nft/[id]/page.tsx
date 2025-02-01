import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DoubleBorder } from "@/components/double-border"
import theme from "@/lib/theme"

export default function NFTItemPage({ params }: { params: { id: string } }) {
  // In a real app, you'd fetch the NFT data based on the ID
  const nft = {
    id: params.id,
    imageUrl: "/placeholder.svg",
    owner: "0x1234...5678",
    mintPrice: 50,
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow p-4">
        <DoubleBorder>
          <Card
            style={{
              backgroundColor: theme.card.background,
              borderRadius: 0,
            }}
          >
            <CardHeader>
              <CardTitle style={{ color: theme.text.primary }}>NFT #{nft.id}</CardTitle>
            </CardHeader>
            <CardContent>
              <img
                src={nft.imageUrl || "/placeholder.svg"}
                alt={`NFT #${nft.id}`}
                className="w-full h-64 object-cover mb-4"
              />
              <p style={{ color: theme.text.secondary }}>
                <strong>Owner:</strong> {nft.owner}
              </p>
              <p style={{ color: theme.text.secondary }}>
                <strong>Original Mint Price:</strong> {nft.mintPrice} FRM
              </p>
            </CardContent>
          </Card>
        </DoubleBorder>
      </main>
    </div>
  )
}

