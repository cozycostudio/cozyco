import * as dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "hardhat-contract-sizer";
import "solidity-coverage";
import "@symblox/hardhat-abi-gen";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.10",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: false,
    strict: true,
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${
        process.env.NEXT_PUBLIC_INFURA_ID || ""
      }`,
      accounts:
        process.env.DEPLOY_PRIVATE_KEY_MAINNET !== undefined
          ? [`0x${process.env.DEPLOY_PRIVATE_KEY_MAINNET}`]
          : [],
    },
    ropsten: {
      url: `https://ropsten.infura.io/v3/${
        process.env.NEXT_PUBLIC_INFURA_ID || ""
      }`,
      accounts:
        process.env.DEPLOY_PRIVATE_KEY_ROPSTEN !== undefined
          ? [`0x${process.env.DEPLOY_PRIVATE_KEY_ROPSTEN}`]
          : [],
    },
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${
        process.env.NEXT_PUBLIC_INFURA_ID || ""
      }`,
      accounts:
        process.env.DEPLOY_PRIVATE_KEY_RINKEBY !== undefined
          ? [`0x${process.env.DEPLOY_PRIVATE_KEY_RINKEBY}`]
          : [],
    },
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
    gasPrice: 100,
    coinmarketcap: process.env.CMC_API_KEY,
    excludeContracts: ["contracts/membership"],
    showTimeSpent: true,
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  abiExporter: {
    path: "./src/abis",
    clear: true,
    flat: true,
    spacing: 2,
  },
};

export default config;
