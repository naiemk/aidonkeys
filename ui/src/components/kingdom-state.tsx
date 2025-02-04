import theme from "@/lib/theme"
import { DoubleBorder } from "./double-border"
import { RewardAvatar } from "./reward-avatar"
import king from '@/img/era3-king.webp'
import queen from '@/img/era3-queen.webp'
import knight from '@/img/era3-knight.webp'

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
            image={king.src}
            text={`KING ${kingCount}`}
            backgroundColor={theme.background.tertiary}
          />
          <RewardAvatar
            image={queen.src}
            text={`QUEEN ${queenCount}`}
            backgroundColor={theme.background.tertiary}
          />
          <RewardAvatar
            image={knight.src}
            text={`KNIGHT ${knightCount}`}
            backgroundColor={theme.background.tertiary}
          />
        </div>
      </div>
    </DoubleBorder>
  )
}

