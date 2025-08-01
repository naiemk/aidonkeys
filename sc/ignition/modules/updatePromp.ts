import { buildModule } from "@nomicfoundation/hardhat-ignition/modules"
import { Prompts } from "./prompts";

const MINTER_ADDRESS = "0x6AFBE05ed6D0D802BA42fFEE1582f754e3D17ed9"
const ERA_ID = '1';

const UpdatePrompt = buildModule("updatePromps", (m) => {
  const minter = m.contractAt("DtnMinter", MINTER_ADDRESS, { id: "newDtnMinter2" })
  const prompts = Prompts[Number(ERA_ID)];

  // Set prompts
  m.call(minter, "setSystmPrompts", [
    prompts.systemPromptFirst,
    prompts.systemPromptLast,
    prompts.nftCreationPrompt,
  ], { id: "setPrompts2" });
  return {
      minter,
  }
});

export default UpdatePrompt


