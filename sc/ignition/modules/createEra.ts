import { buildModule } from "@nomicfoundation/hardhat-ignition/modules"
import { ethers } from "hardhat";
import { Prompts } from "./prompts";

const NFT_ADDRESS = "0x2769835C26838e02D15295809E775d6Efd0595b3"
const MINTER_ADDRESS = "0x6AFBE05ed6D0D802BA42fFEE1582f754e3D17ed9"
const ERA_ID = '1';

const DeployEraNft = buildModule("createEra", (m) => {
  const owner = m.getAccount(0);
  const eraId = process.env.ERA_ID || ERA_ID;

  const nft = m.contractAt("EraNFT", NFT_ADDRESS, { id: "lastEraNFT" })
  const minter = m.contractAt("DtnMinter", MINTER_ADDRESS, { id: "lastMinter" })
  const prompts = Prompts[Number(ERA_ID)];

  m.call(nft, "createEra", [
    eraId, "Era 1", ethers.parseEther("0.0001"), Math.floor(Date.now() / 1000),
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

