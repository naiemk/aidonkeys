import { buildModule } from "@nomicfoundation/hardhat-ignition/modules"
import { ethers } from "hardhat";

const DTN_ROUTER = "0x45B80f551646fDaC777A4991FbdA748Fc5A72194";

const DeployEraNft = buildModule("DeployEraNft", (m) => {
  /**
   * 1. Deploy DtnMinter
   * 2. Deploy EraNft
   * 3. Set dependencies on minter and nft
   */
  const owner = m.getAccount(0);
  const dtnRouter = process.env.DTN_ROUTER_ADDRESS || DTN_ROUTER;
  if (!dtnRouter) throw new Error("DTN_ROUTER is not set");

  // Deploy DtnMinter
  const minter = m.contract("DtnMinter", [], { id: "newDtnMinter" })
  m.call(minter, "setDtn", [dtnRouter]);

  const nftImpl = m.contract("EraNFT", ["AI Donkey", "DNK", owner], { id: "newEraNFT" })
  m.call(nftImpl, "setMinter", [minter]);

  m.call(nftImpl, "createEra", [1, "Era 1",
    ethers.parseEther("0.00001"), Math.floor(Date.now() / 1000),
    "Create a king", "Create a queen", "Create a knight"])

  // Set nft on minter
  m.call(minter, "setNft", [nftImpl]);

  // config
  m.call(minter, "config", [
    3000000, // callbackGas
    "model.system.openai-gpt-image-1", // imageModel
    "model.system.openai-gpt-5-mini", // textModel
    "node.author1.node1", // server
    ethers.parseEther("0.000001") // feePerByte
  ]);

  // Set config
  return {
      minter,
      nftImpl
  }
});

export default DeployEraNft
