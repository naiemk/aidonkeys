import Image from "next/image"
import { DoubleBorder } from "./double-border"
import theme from "@/lib/theme"

export function EraSummary() {
  return (
    <DoubleBorder>
      <section
        style={{
          backgroundColor: theme.card.background,
        }}
        className="flex flex-col"
      >
        <div className="relative w-full aspect-[2/1]">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/DALL%C2%B7E%202025-01-13%2003.10.59%20-%20A%20playful%20and%20artistic%20abstract%20digital%20landscape%20for%20an%20AI%20NFT%20website,%20incorporating%208-bit%20graphics%20and%20monkey%20degen%20elements.%20The%20background%20should-NXkxOEv45XTqPiy65iOzGQyT9uCocf.webp"
            alt="Current Era Theme"
            fill
            className="object-cover"
            priority
          />
        </div>

        <div className="p-6 space-y-4">
          {/* Theme and Mints Info */}
          <div className="text-lg font-bold" style={{ color: theme.text.primary }}>
            Cyberpunk 2077 - NFTs Minted: 1337
          </div>

          {/* Price and Countdown */}
          <div className="flex flex-col sm:flex-row justify-between gap-4" style={{ color: theme.text.secondary }}>
            <div className="flex-1">
              <div className="text-sm mb-1">Current Price:</div>
              <div className="text-3xl font-bold">50 FRM</div>
            </div>

            <div className="flex-1 sm:text-right">
              <div className="text-sm mb-1">Next Era Countdown:</div>
              <div className="text-3xl font-bold">23:59:59</div>
            </div>
          </div>
        </div>
      </section>
    </DoubleBorder>
  )
}

