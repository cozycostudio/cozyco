import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const CozyCoFriends = await ethers.getContractFactory("CozyCoFriends");
  const contract = await CozyCoFriends.deploy({
    gasLimit: ethers.BigNumber.from(2000000),
  });
  console.log("CozyCoFriends deployed to:", contract.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
