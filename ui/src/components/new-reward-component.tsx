import { Button } from "@/components/ui/button"
import theme from "@/lib/theme"
import { DoubleBorder } from "./double-border"

export function NewRewardComponent() {
  return (
    <DoubleBorder>
      <div
        style={{
          backgroundColor: theme.accent.primary,
        }}
        className="p-4 text-center"
      >
        <h2 style={{ color: theme.text.primary }} className="text-xl font-bold mb-2">
          New Reward Available!
        </h2>
        <Button>Claim Reward</Button>
      </div>
    </DoubleBorder>
  )
}

