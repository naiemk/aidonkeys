import theme from "@/lib/theme"
import { DoubleBorder } from "./double-border"

export function RewardsComponent({ rewards }: { rewards: number }) {
  return (
    <DoubleBorder>
      <div
        style={{
          backgroundColor: theme.card.background,
        }}
        className="p-4"
      >
        <h2 style={{ color: theme.text.primary }} className="text-xl font-bold mb-2">
          Your Rewards
        </h2>
        <p style={{ color: theme.text.secondary }} className="text-3xl">
          {rewards} FRM
        </p>
      </div>
    </DoubleBorder>
  )
}

