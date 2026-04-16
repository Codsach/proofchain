import { HardhatUserConfig, subtask } from "hardhat/config";
import { TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD } from "hardhat/builtin-tasks/task-names";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, ".env") });
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
dotenv.config();

const LOCAL_SOLC_VERSION = "0.8.26";

subtask(TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD).setAction(
  async ({ solcVersion }, _hre, runSuper) => {
    if (solcVersion === LOCAL_SOLC_VERSION) {
      return {
        version: LOCAL_SOLC_VERSION,
        longVersion: LOCAL_SOLC_VERSION,
        compilerPath: require.resolve("solc/soljson.js"),
        isSolcJs: true,
      };
    }

    return runSuper();
  }
);

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    // Local hardhat node — use for testing before touching testnet
    hardhat: {},
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    // Polygon Amoy testnet — get free MATIC from https://faucet.polygon.technology
    amoy: {
      url: process.env.POLYGON_RPC_URL || "https://rpc-amoy.polygon.technology",
      accounts: process.env.SYSTEM_WALLET_PRIVATE_KEY
        ? [process.env.SYSTEM_WALLET_PRIVATE_KEY]
        : [],
      chainId: 80002,
    },
  },
 etherscan: {
    apiKey: process.env.POLYGONSCAN_API_KEY,
    customChains: [
      {
        network: "polygonAmoy",
        chainId: 80002,
        urls: {
          apiURL: "https://api-amoy.polygonscan.com/api",
          browserURL: "https://amoy.polygonscan.com",
        },
      },
    ],
  }
};

export default config;