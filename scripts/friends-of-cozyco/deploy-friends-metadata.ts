import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const FriendsOfCozyCoMetadata = await ethers.getContractFactory(
    "FriendsOfCozyCoMetadata"
  );
  const contract = await FriendsOfCozyCoMetadata.deploy(
    "Friend of Cozy Co.",
    "A special card for exclusive access to cozy wares and discounts.",
    "ipfs://QmddGvzRrAvhchqTB2h92UJrR4BXtZWAM2VhDFemwwkxH9",
    {
      gasLimit: ethers.BigNumber.from(885000),
    }
  );
  console.log("FriendsOfCozyCoMetadata deployed to:", contract.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
