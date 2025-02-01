import theme from "@/lib/theme"
import { DoubleBorder } from "./double-border"
import { RewardAvatar } from "./reward-avatar"

interface KingdomStateProps {
  kingCount: number
  queenCount: number
  knightCount: number
}

export function KingdomState({ kingCount, queenCount, knightCount }: KingdomStateProps) {
  return (
    <DoubleBorder>
      <div
        style={{
          backgroundColor: theme.card.background,
        }}
        className="p-4"
      >
        <h2 style={{ color: theme.text.primary }} className="text-2xl font-bold mb-4 text-center">
          STATE OF YOUR KINGDOM
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <RewardAvatar
            image="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image.jpg-BjnuJrgZx3Z1bpQgUE4lbpdtFBk9H4.jpeg"
            text={`KING ${kingCount}`}
            backgroundColor={theme.background.tertiary}
          />
          <RewardAvatar
            image="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image.jpg-BjnuJrgZx3Z1bpQgUE4lbpdtFBk9H4.jpeg"
            text={`QUEEN ${queenCount}`}
            backgroundColor={theme.background.secondary}
          />
          <RewardAvatar
            image="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image.jpg-BjnuJrgZx3Z1bpQgUE4lbpdtFBk9H4.jpeg"
            text={`KNIGHT ${knightCount}`}
            backgroundColor={theme.background.secondary}
          />
        </div>
      </div>
    </DoubleBorder>
  )
}

