import Image from "next/image"
import { DoubleBorder } from "./double-border"
import theme from "@/lib/theme"
import { useConfig, useGeneralInfo } from "@/utils/conf";
import era3 from '@/img/era3.webp'
import { useConnectWalletSimple } from "web3-react-ui";

const DEFAULT_ERA_IMAGE = era3.src

export function EraSummary() {
  const { chainId } = useConnectWalletSimple();
  const { eraImages, nftContract } = useConfig(chainId);
  const generalInfo = useGeneralInfo();

  return (
    <DoubleBorder>
      <section
        style={{
          backgroundColor: theme.card.background,
        }}
        className="flex flex-col"
      >
        <div className="relative w-full aspect-[3/2]">
          <Image
            src={eraImages?.[generalInfo.currentEra.id] || DEFAULT_ERA_IMAGE}
            alt="Current Era Theme"
            fill
            className="object-cover"
            priority
          />
        </div>

        <div className="p-6 space-y-4">
          {/* Theme and Mints Info */}
          <div className="text-lg font-bold" style={{ color: theme.text.primary }}>
            {generalInfo.currentEra.title} - NFTs Minted: {generalInfo.currentEra.totalMinted} <br/>
            <span className="text-sm">NFT Contract: {nftContract} (chain #{chainId})</span>
          </div>

          {/* Price and Countdown */}
          <div className="flex flex-col sm:flex-row justify-between gap-4" style={{ color: theme.text.secondary }}>
            <div className="flex-1">
              <div className="text-sm mb-1">Current Price:</div>
              <div className="text-3xl font-bold">{generalInfo.mintPriceDisplay} ETH</div>
            </div>

            <div className="flex-1 sm:text-right">
              <div className="text-sm mb-1">Era starting price:</div>
              <div className="text-3xl font-bold">{generalInfo.currentEra.startPriceDisplay} ETH</div>
            </div>
          </div>
        </div>
      </section>
    </DoubleBorder>
  )
}

