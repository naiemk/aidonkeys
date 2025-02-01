import Image from "next/image"
import theme from "@/lib/theme"

interface RewardAvatarProps {
  image: string
  text: string
  backgroundColor: string
}

export function RewardAvatar({ image, text, backgroundColor }: RewardAvatarProps) {
  return (
    <div className="border-4 border-white p-2" style={{ backgroundColor }}>
      <div className="relative w-full aspect-square mb-2">
        <Image src={image || "/placeholder.svg"} alt={text} fill className="object-cover" priority />
      </div>
      <div className="text-center">
        <span style={{ color: theme.text.secondary }} className="text-4xl font-bold">
          {text}
        </span>
      </div>
    </div>
  )
}

