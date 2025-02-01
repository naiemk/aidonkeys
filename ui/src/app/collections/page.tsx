"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { EraCollection } from "@/components/era-collection"
import theme from "@/lib/theme"

// Mock data - replace with actual data fetching in a real application
const mockCollections = {
  "Cyberpunk 2077": Array.from({ length: 50 }, (_, i) => ({ id: `cp-${i + 1}`, imageUrl: "/placeholder.svg" })),
  "Space Odyssey": Array.from({ length: 40 }, (_, i) => ({ id: `so-${i + 1}`, imageUrl: "/placeholder.svg" })),
  "Steampunk Revolution": Array.from({ length: 30 }, (_, i) => ({ id: `sr-${i + 1}`, imageUrl: "/placeholder.svg" })),
}

export default function CollectionsPage() {
  const [showOwned, setShowOwned] = useState(false)

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow p-4 w-full max-w-[950px] mx-auto">
        <Button
          variant="outline"
          size="lg"
          className="mb-4"
          style={{
            backgroundColor: theme.button.background,
            color: theme.text.primary,
            border: `2px solid ${theme.button.border}`,
            fontSize: "1rem",
            padding: "0.75rem 1.5rem",
          }}
          onClick={() => setShowOwned(!showOwned)}
        >
          {showOwned ? "✓ " : ""}Show only my NFTs
        </Button>
        <div className="space-y-6">
          {Object.entries(mockCollections).map(([era, nfts]) => (
            <EraCollection key={era} era={era} nfts={nfts} />
          ))}
        </div>
      </main>
    </div>
  )
}

