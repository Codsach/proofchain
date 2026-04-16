import { ethers } from "hardhat";

async function main() {
  const signers = await ethers.getSigners();
  const deployer = signers[0];

  if (deployer === undefined) {
    throw new Error(
      "No deployer account is configured for the selected network. Set SYSTEM_WALLET_PRIVATE_KEY before running this script."
    );
  }

  console.log("Deploying EvidenceRegistry...");
  console.log("Deployer address:", deployer.address);
  console.log(
    "Deployer balance:",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    "MATIC"
  );

  const EvidenceRegistry = await ethers.getContractFactory("EvidenceRegistry");
  const deploymentOverrides: {
    gasLimit?: bigint;
    maxFeePerGas?: bigint;
    maxPriorityFeePerGas?: bigint;
  } = {};

  const network = await ethers.provider.getNetwork();

  if (network.chainId === 80002n) {
    const deployTx = await EvidenceRegistry.getDeployTransaction();
    const gasEstimate = await deployer.estimateGas({
      data: deployTx.data,
    });
    const gasLimit = (gasEstimate * 120n) / 100n;
    const maxFeePerGas = ethers.parseUnits(
      process.env.AMOY_MAX_FEE_GWEI ?? "30",
      "gwei"
    );
    const maxPriorityFeePerGas = ethers.parseUnits(
      process.env.AMOY_MAX_PRIORITY_FEE_GWEI ?? "30",
      "gwei"
    );

    deploymentOverrides.gasLimit = gasLimit;
    deploymentOverrides.maxFeePerGas = maxFeePerGas;
    deploymentOverrides.maxPriorityFeePerGas = maxPriorityFeePerGas;

    console.log(
      "Using Amoy fee caps:",
      `${ethers.formatUnits(maxFeePerGas, "gwei")} max fee / ${ethers.formatUnits(
        maxPriorityFeePerGas,
        "gwei"
      )} priority fee`
    );
    console.log("Estimated gas:", gasEstimate.toString());
    console.log(
      "Estimated max deployment cost:",
      `${ethers.formatEther(gasLimit * maxFeePerGas)} MATIC`
    );
  }

  const contract = await EvidenceRegistry.deploy(deploymentOverrides);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("\n✓ EvidenceRegistry deployed to:", address);
  console.log("\nAdd this to your .env.local:");
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${address}`);
  console.log("\nVerify on Polygonscan (after a few minutes):");
  console.log(`npx hardhat verify --network amoy ${address}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
