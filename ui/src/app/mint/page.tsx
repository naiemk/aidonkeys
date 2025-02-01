"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { ThemeComponent } from "@/components/theme-component"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DoubleBorder } from "@/components/double-border"
import { Info } from "lucide-react"
import theme from "@/lib/theme"

export default function MintPage() {
  const [description, setDescription] = useState("")
  const [mintPrice, setMintPrice] = useState(50)

  useEffect(() => {
    const interval = setInterval(() => {
      setMintPrice((prev) => prev + Math.floor(Math.random() * 10) - 5)
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow p-4 space-y-6 w-full max-w-[950px] mx-auto">
        <ThemeComponent currentTheme="Cyberpunk 2077" />

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
              {mintPrice} FRM
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
              className="mb-4"
              style={{
                backgroundColor: theme.input.background,
                color: theme.input.text,
                borderRadius: 0,
              }}
            />
            <p style={{ color: theme.text.secondary }} className="mb-4">
              {description.length}/111 characters
            </p>
            <Button size="lg" className="w-full">
              MINT NOW
            </Button>
          </div>
        </DoubleBorder>
      </main>
    </div>
  )
}

