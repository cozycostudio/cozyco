import * as dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "hardhat-contract-sizer";
import "solidity-coverage";

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
      url: process.env.MAINNET_URL || "",
      accounts:
        process.env.MAINNET_PRIVATE_KEY !== undefined
          ? [`0x${process.env.MAINNET_PRIVATE_KEY}`]
          : [],
    },
    ropsten: {
      url: process.env.ROPSTEN_URL || "",
      accounts:
        process.env.ROPSTEN_PRIVATE_KEY !== undefined
          ? [`0x${process.env.ROPSTEN_PRIVATE_KEY}`]
          : [],
    },
    rinkeby: {
      url: process.env.RINKEBY_URL || "",
      accounts:
        process.env.RINKEBY_PRIVATE_KEY !== undefined
          ? [`0x${process.env.RINKEBY_PRIVATE_KEY}`]
          : [],
    },
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
    gasPrice: 100,
    coinmarketcap: process.env.CMC_API_KEY,
    excludeContracts: ["contracts/membership"],
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

export default config;
