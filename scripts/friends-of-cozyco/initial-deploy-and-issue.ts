import { ethers } from "hardhat";

import friends from "../../data/membership-list.json";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const FriendsOfCozyCoMetadata = await ethers.getContractFactory(
    "FriendsOfCozyCoMetadata"
  );
  const friendsOfCozyCoMetadata = await FriendsOfCozyCoMetadata.deploy(
    "Friend of cozy co.",
    "A special card for exclusive access to cozy wares and discounts.",
    "ipfs://QmddGvzRrAvhchqTB2h92UJrR4BXtZWAM2VhDFemwwkxH9",
    {
      gasLimit: ethers.BigNumber.from(885000),
    }
  );
  console.log("FriendsOfCozyCoMetadata.sol:", friendsOfCozyCoMetadata.address);

  const CozyCoFriends = await ethers.getContractFactory("CozyCoFriends");
  const cozyCoFriends = await CozyCoFriends.deploy({
    gasLimit: ethers.BigNumber.from(2750000),
  });
  console.log("CozyCoFriends.sol:", cozyCoFriends.address);

  await cozyCoFriends.setTokenTypeMetadataAddress(
    0,
    friendsOfCozyCoMetadata.address
  );
  console.log("Set metadata for initial token type");

  await cozyCoFriends.issueMemberships(friends, 0, {
    gasLimit: ethers.BigNumber.from(4575000),
  });
  console.log("Minted to friends");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
