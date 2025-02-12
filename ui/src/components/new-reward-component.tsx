import { Button } from "@/components/ui/button"
import theme from "@/lib/theme"
import { DoubleBorder } from "./double-border"
import { useConnectWalletSimple, useContracts } from "web3-react-ui";
import { ABI, useConfig } from "@/utils/conf";
import { useEffect, useState } from "react";
import { TransactionModal } from "./web3/transaction-modal";

export function NewRewardComponent() {
  const [pending, setPending] = useState(false);
  const [eligibleForRewards, setEligibleForRewards] = useState(false);
  const { chainId, address } = useConnectWalletSimple();
  const { nftContract } = useConfig(chainId);
  const { callMethod, execute } = useContracts();
  const [transactionId, setTransactionId] = useState("");
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);

  const loadEligibilit = async () => {
    if (!chainId || !address ||!nftContract) {
      return;
    }
    const eligibleForRewards = await callMethod(chainId!, nftContract, ABI.rewardEligibility, [address]);
    console.log('eligibleForRewards', eligibleForRewards);
    setEligibleForRewards(eligibleForRewards);
  }

  useEffect(() => {
    loadEligibilit();
  }, [chainId, address, callMethod, nftContract]);

  const claimReward = async () => {
    setPending(true);
    try {
      if (!chainId || !nftContract) {
        return
      }
      const tx = await execute(nftContract, ABI.claimReward, [], { wait: true, gasLimit: 1000000 });
      console.log('tx', tx);
      if (tx && tx.hash) {
        setIsTransactionModalOpen(true)
        setTransactionId(tx.hash)
        console.log('Resetting eligibility');
        setEligibleForRewards(false);
        setTimeout(() => {
          loadEligibilit();
        }, 25000);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <>
    {eligibleForRewards && <DoubleBorder>
      <div
        style={{
          backgroundColor: theme.accent.primary,
        }}
        className="p-4 text-center"
      >
        <h2 style={{ color: theme.text.primary }} className="text-xl font-bold mb-2">
          New Reward Available!
        </h2>
        <Button onClick={claimReward} disabled={!eligibleForRewards || pending}>Claim Reward</Button>
      </div>
    </DoubleBorder>}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        transactionId={transactionId!}
        chainId={chainId!}
        message="You claimed your reward using the following transaction. Check back again in a few minutes."
      />
    </>
  )
}

