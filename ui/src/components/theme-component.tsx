import theme from "@/lib/theme"
import { DoubleBorder } from "./double-border"

export function ThemeComponent({ currentTheme }: { currentTheme: string }) {
  return (
    <DoubleBorder>
      <div
        style={{
          backgroundColor: theme.card.background,
        }}
        className="p-4"
      >
        <h2 style={{ color: theme.text.primary }} className="text-xl font-bold mb-2">
          Current Theme
        </h2>
        <p style={{ color: theme.text.secondary }} className="text-3xl">
          {currentTheme}
        </p>
      </div>
    </DoubleBorder>
  )
}

