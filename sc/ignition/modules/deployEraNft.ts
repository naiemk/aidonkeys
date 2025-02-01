import { buildModule } from "@nomicfoundation/hardhat-ignition/modules"
import { ethers } from "hardhat";

const DeployEraNft = buildModule("DeployEraNft", (m) => {
  const minter = process.env.MINTER_ADDRESS
  if (!minter) throw new Error("MINTER_ADDRESS is not set")
  const owner = m.getAccount(0)
  const stakeImpl = m.contract("EraNFT", ["AI Donkey", "DNK", owner], { id: "newEraNFT" })
  m.call(stakeImpl, "setMinter", [minter])
  m.call(stakeImpl, "createEra", [1, "Era 1", ethers.parseEther("0.001"), Math.floor(Date.now() / 1000)])
  return {
      stakeImpl
  }
});

export default DeployEraNft
