import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
require("dotenv").config({path: __dirname + '/localConfig/.env'});

const panick = (msg: string) => { throw new Error(msg) }

const accounts: any = process.env.TEST_ACCOUNT_PRIVATE_KEY ? [process.env.TEST_ACCOUNT_PRIVATE_KEY] :
  process.env.TEST_ACCOUNT_PRIVATE_KEY ? { mnemonic: process.env.TEST_MNEMONICS } : panick("TEST_ACCOUNT_PRIVATE_KEY or TEST_MNEMONICS is not set");

const config: HardhatUserConfig = {
  solidity: {compilers: [
    {
      version: "0.8.28",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
    }, {
      version: "0.8.24",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
    }]
    },
  networks: {
    hardhat: {
      allowBlocksWithSameTimestamp: true,
    },
    local: {
      url: "http://localhost:8545",
      chainId: 1337,
    },
    sepolia: {
      chainId: 11155111,
      // url: "https://ethereum-sepolia-rpc.publicnode.com",
      url: "https://eth-sepolia.g.alchemy.com/public",
      accounts,
    },
  },
    etherscan: {
    // Your API key for Etherscan
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  sourcify: {
    // Disabled by default
    // Doesn't need an API key
    enabled: true
  }, ignition: {
    strategyConfig: {
      create2: {
        salt: "0x000046657272756D2E5072642E4149446F6E6B65795F5630302E3030302E3031",
      },
    },
  },
};

export default config;
