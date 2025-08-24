import { buildModule } from "@nomicfoundation/hardhat-ignition/modules"
import { ethers } from "hardhat";
import { Prompts } from "./prompts";

const NFT_ADDRESS = "0x45024485C1A4E9fAe18cE02Be88c37E15ee0Bbd5"
const MINTER_ADDRESS = "0x6bcE0AE911A97e4fB48A2ac689d61c6D3B2E0e7C"
const ERA_ID = '1';

const DeployEraNft = buildModule("createEra", (m) => {
  const owner = m.getAccount(0);
  const eraId = process.env.ERA_ID || ERA_ID;

  const nft = m.contractAt("EraNFT", NFT_ADDRESS, { id: "lastEraNFT" })
  const minter = m.contractAt("DtnMinter", MINTER_ADDRESS, { id: "lastMinter" })
  const prompts = Prompts[Number(ERA_ID)];

  m.call(nft, "createEra", [
    eraId, "Era 1", ethers.parseEther("0.00001"), Math.floor(Date.now() / 1000),
    prompts.kingPrompt,
    prompts.queenPrompt,
    prompts.knightPrompt,
  ])

  // Set prompts
  m.call(minter, "setSystmPrompts", [
    prompts.systemPromptFirst,
    prompts.systemPromptLast,
    prompts.nftCreationPrompt,
  ], { id: "setPrompts" });
  return {
      nft,
      minter,
  }
});

export default DeployEraNft

