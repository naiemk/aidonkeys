import Link from "next/link"
import theme from "@/lib/theme"
import Web3Connect from "./web3/web3-connect"

export function Header() {
  return (
    <div className="w-full" style={{ backgroundColor: theme.background.secondary }}>
      <header
        className="flex justify-between items-center p-4 w-full max-w-[950px] mx-auto"
        style={{ backgroundColor: theme.background.secondary }}
      >
        <Link href="/" className="text-2xl font-bold" style={{ color: theme.text.primary }}>
          AI Donkeys - Build Your Donkey Kingdom
        </Link>
        <Web3Connect />
      </header>
    </div>
  )
}

