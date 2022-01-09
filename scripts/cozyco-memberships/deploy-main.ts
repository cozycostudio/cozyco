import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());
  const provider = ethers.getDefaultProvider();

  const gasPrice = await provider.getGasPrice();
  console.log("Current gas price: " + gasPrice.toString());

  const CozyCoMembership = await ethers.getContractFactory("CozyCoMembership");
  const contract = await CozyCoMembership.deploy({
    gasLimit: ethers.BigNumber.from(2205000),
  });
  console.log("CozyCoMembership deployed to:", contract.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
