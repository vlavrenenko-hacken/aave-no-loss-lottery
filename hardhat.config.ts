import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import 'solidity-docgen';

require("dotenv").config("./.env");

const config: HardhatUserConfig = {
  networks: {
    hardhat: {
      forking: {
        url: `https://polygon-mainnet.g.alchemy.com/v2/${process.env.WEB3_ALCHEMY_POLYGON_ID}`,
        blockNumber: 40082090,
      }
    }
  },
  solidity: {
    compilers: [
      {
        version: "0.8.10",
        settings: {
          optimizer:{
            enabled: true,
            runs: 200
          }
        },
      },
      {
        version: "0.8.18",
        settings: {
          optimizer:{
            enabled: true,
            runs: 200
          }
        },
      }
    ]
  }
};

export default config;
