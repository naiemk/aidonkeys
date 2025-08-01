import { buildModule } from "@nomicfoundation/hardhat-ignition/modules"
import { ethers } from "hardhat";

const DTN_ROUTER = "0x1BC1062B3cCDe51b7727098B0488Fd71c9f784B2";

const DeployEraNft = buildModule("DeployEraNft", (m) => {
  /**
   * 1. Deploy DtnMinter
   * 2. Deploy EraNft
   * 3. Set dependencies on minter and nft
   */
  const owner = m.getAccount(0);
  const dtnRouter = process.env.DTN_ROUTER_ADDRESS || DTN_ROUTER;
  if (!dtnRouter) throw new Error("MINTER_ADDRESS is not set");

  // Deploy DtnMinter
  const minter = m.contract("DtnMinter", [], { id: "newDtnMinter" })
  m.call(minter, "setDtn", [dtnRouter]);

  const nftImpl = m.contract("EraNFT", ["AI Donkey", "DNK", owner], { id: "newEraNFT" })
  m.call(nftImpl, "setMinter", [minter]);

  m.call(nftImpl, "createEra", [1, "Era 1",
    ethers.parseEther("0.001"), Math.floor(Date.now() / 1000),
    "Create a king", "Create a queen", "Create a knight"])

  // Set nft on minter
  m.call(minter, "setNft", [nftImpl]);

  // config
  m.call(minter, "config", [
    3000000, // callbackGas
    "model.system.openai-gpt-o3-simpleimage", // imageModel
    "model.system.openai-gpt-o3-simpletext", // textModel
    "node.tester.node1", // server
    ethers.parseEther("0.000001") // feePerByte
  ]);

  // Set config
  return {
      minter,
      nftImpl
  }
});

export default DeployEraNft
