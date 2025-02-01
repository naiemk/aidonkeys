import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
require("dotenv").config({path: __dirname + '/localConfig/.env'});

const panick = (msg: string) => { throw new Error(msg) }

const accounts: any = process.env.TEST_ACCOUNT_PRIVATE_KEY ? [process.env.TEST_ACCOUNT_PRIVATE_KEY] :
  process.env.TEST_ACCOUNT_PRIVATE_KEY ? { mnemonic: process.env.TEST_MNEMONICS } : panick("TEST_ACCOUNT_PRIVATE_KEY or TEST_MNEMONICS is not set");

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    local: {
      url: "http://localhost:8545",
      chainId: 1337,
    },
    arbitrumOne: {
      chainId: 42161,
      url: process.env.ARBITRUM_RPC! || panick("ARBITRUM_RPC is not set. Set it in ./localConfig/.env"),
      accounts,
    },
    ferrum_mainnet: {
      chainId: 26100,
      url: "https://qpn.svcs.ferrumnetwork.io/",
      accounts,
      allowUnlimitedContractSize: true,
      gas: 1000000, // this override is required for Substrate based evm chains
    },
    bsctestnet: {
      chainId: 97,
      url: process.env.BSC_TESTNET_RPC,
      accounts,
      // gas: 1000000,
      // gasPrice: 20000000000,
    },
  },
    etherscan: {
    // Your API key for Etherscan
    apiKey: {
      // bscTestnet: getEnv("BSCSCAN_API_KEY"),
      // polygonMumbai: getEnv("POLYGONSCAN_API_KEY"),
      // btfd_ghostnet: getEnv("POLYGONSCAN_API_KEY"),
      arbitrumOne: process.env.ARBISCAN_API_KEY!,
      base: process.env.BASESCAN_API_KEY!,
      bsc: process.env.BSCSCAN_API_KEY!,
      bscTestnet: process.env.BSCSCAN_API_KEY!,
      ferrum_testnet: 'empty',
      ferrum_mainnet: 'empty',
    },
      customChains: [
    {
      network: "ferrum_mainnet",
      chainId: 26100,
      urls: {
        apiURL: "https://explorer.ferrumnetwork.io/api",
        browserURL: "http://explorer.ferrumnetwork.io/"
      }
    }
  ]
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
