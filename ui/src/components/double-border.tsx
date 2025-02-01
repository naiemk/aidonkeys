import type React from "react"
import theme from "@/lib/theme"

interface DoubleBorderProps {
  children: React.ReactNode
  className?: string
}

export function DoubleBorder({ children, className = "" }: DoubleBorderProps) {
  return (
    <div
      className={`border-4 ${className}`}
      style={{ borderColor: theme?.border?.surround || "#ffffff" }} // White outer border with fallback
    >
      <div
        className="border-4"
        style={{ borderColor: theme?.border?.default || "#000000" }} // Black inner border with fallback
      >
        {children}
      </div>
    </div>
  )
}

