import { buildModule } from "@nomicfoundation/hardhat-ignition/modules"
import { ethers } from "hardhat";
import { Prompts } from "./prompts";

const NFT_ADDRESS = "0x45024485C1A4E9fAe18cE02Be88c37E15ee0Bbd5"
const MINTER_ADDRESS = "0xeF317f575D20Da1aC82f69F6A5C85266F0D48EAd"
const ERA_ID = '2';

const DeployEraNft = buildModule("createEra", (m) => {
  const owner = m.getAccount(0);
  const eraId = process.env.ERA_ID || ERA_ID;

  const nft = m.contractAt("EraNFT", NFT_ADDRESS, { id: "lastEraNFT2" })
  const minter = m.contractAt("DtnMinter", MINTER_ADDRESS, { id: "lastMinter2" })
  const prompts = Prompts[Number(ERA_ID)];

  m.call(nft, "createEra", [
    eraId, "Era 1", ethers.parseEther("0.0000001"), Math.floor(Date.now() / 1000),
    prompts.kingPrompt,
    prompts.queenPrompt,
    prompts.knightPrompt,
  ])

  // Set prompts
  m.call(minter, "setSystmPrompts", [
    prompts.systemPromptFirst,
    prompts.systemPromptLast,
    prompts.nftCreationPrompt,
  ], { id: "setPrompts2" });
  return {
      nft,
      minter,
  }
});

export default DeployEraNft

