import { buildModule } from "@nomicfoundation/hardhat-ignition/modules"
import { ethers } from "hardhat";

const deployedAddress = "0x9C2728A4C1B635FEFDFE3b1d0D6Bb715b629C41F"

const DeployEraNft = buildModule("createEra", (m) => {
  const stakeImpl = m.contractAt("EraNFT", deployedAddress, { id: "lastEraNFT" })
  m.call(stakeImpl, "createEra", [1, "Era 1", ethers.parseEther("0.0001"), Math.floor(Date.now() / 1000)])
  return {
      stakeImpl
  }
});

export default DeployEraNft

