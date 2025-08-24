import { buildModule } from "@nomicfoundation/hardhat-ignition/modules"
import { ethers } from "hardhat";
import { Prompts } from "./prompts";

const DTN_ROUTER = "0x45B80f551646fDaC777A4991FbdA748Fc5A72194";
const NFT = "0x45024485C1A4E9fAe18cE02Be88c37E15ee0Bbd5";
const ERA_ID = "1";

const UpgradeMinter = buildModule("UpgradeMinter", (m) => {
  /**
   * 1. Deploy DtnMinter
   * 2. Deploy EraNft
   * 3. Set dependencies on minter and nft
   */
  const dtnRouter = process.env.DTN_ROUTER_ADDRESS || DTN_ROUTER;
  if (!dtnRouter) throw new Error("DTN_ROUTER is not set");

  const nftImpl = m.contractAt("EraNFT", NFT, { id: "newEraNFTtoUpg" })

  // Deploy DtnMinter
  const minter = m.contract("DtnMinter", [], { id: "newDtnMintertoUpg" })
  m.call(minter, "setDtn", [dtnRouter]);
  m.call(minter, "setNft", [nftImpl]);

  m.call(nftImpl, "setMinter", [minter]);

  // Set prompts
  const prompts = Prompts[Number(ERA_ID)];
  m.call(minter, "setSystmPrompts", [
    prompts.systemPromptFirst,
    prompts.systemPromptLast,
    prompts.nftCreationPrompt,
  ], { id: "setPromptsToUpg" });
  // Set config
  return {
      minter,
      nftImpl
  }
});

export default UpgradeMinter
