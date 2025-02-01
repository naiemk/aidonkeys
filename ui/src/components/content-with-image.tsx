import type React from "react"
import { DoubleBorder } from "./double-border"
import theme from "@/lib/theme"

interface ContentWithImageProps {
  leftContent: React.ReactNode
  rightContent: React.ReactNode
}

export function ContentWithImage({ leftContent, rightContent }: ContentWithImageProps) {
  return (
    <DoubleBorder>
      <section
        style={{
          backgroundColor: theme.card.background,
        }}
        className="p-6"
      >
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex-1 relative">{leftContent}</div>
          <div className="flex-1 relative">{rightContent}</div>
        </div>
      </section>
    </DoubleBorder>
  )
}

