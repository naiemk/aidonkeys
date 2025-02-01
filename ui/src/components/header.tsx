import Link from "next/link"
import { Button } from "@/components/ui/button"
import theme from "@/lib/theme"

export function Header() {
  return (
    <div className="w-full" style={{ backgroundColor: theme.background.secondary }}>
      <header
        className="flex justify-between items-center p-4 w-full max-w-[950px] mx-auto"
        style={{ backgroundColor: theme.background.secondary }}
      >
        <Link href="/" className="text-2xl font-bold" style={{ color: theme.text.primary }}>
          AI NFT Gen
        </Link>
        <Button>Connect Wallet</Button>
      </header>
    </div>
  )
}

