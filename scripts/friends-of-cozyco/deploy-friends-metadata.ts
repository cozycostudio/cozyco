import { ethers } from "hardhat";

export const friendsOfCozyCoConstructor = {
  name: "Friend of cozy co.",
  description:
    "A special card for exclusive access to cozy wares and discounts.",
  image: "ipfs://QmddGvzRrAvhchqTB2h92UJrR4BXtZWAM2VhDFemwwkxH9",
};

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const FriendsOfCozyCoMetadata = await ethers.getContractFactory(
    "FriendsOfCozyCoMetadata"
  );
  const contract = await FriendsOfCozyCoMetadata.deploy(
    friendsOfCozyCoConstructor.name,
    friendsOfCozyCoConstructor.description,
    friendsOfCozyCoConstructor.image,
    {
      gasLimit: ethers.BigNumber.from(910000),
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
