import { ethers } from "hardhat";
import friends from "../../data/membership-list.json";
import { friendsOfCozyCoConstructor } from "./deploy-friends-metadata";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy the metadata contract
  const FriendsOfCozyCoMetadata = await ethers.getContractFactory(
    "FriendsOfCozyCoMetadata"
  );
  const friendsOfCozyCoMetadata = await FriendsOfCozyCoMetadata.deploy(
    friendsOfCozyCoConstructor.name,
    friendsOfCozyCoConstructor.description,
    friendsOfCozyCoConstructor.image,
    {
      gasLimit: ethers.BigNumber.from(910000),
    }
  );
  console.log("FriendsOfCozyCoMetadata.sol:", friendsOfCozyCoMetadata.address);

  // Deploy the main membership contract
  const CozyCoFriends = await ethers.getContractFactory("CozyCoFriends");
  const cozyCoFriends = await CozyCoFriends.deploy({
    gasLimit: ethers.BigNumber.from(2000000),
  });
  console.log("CozyCoFriends.sol:", cozyCoFriends.address);

  // Set the metadata address for tokenId 1
  await cozyCoFriends.setTokenTypeMetadataAddress(
    1,
    friendsOfCozyCoMetadata.address
  );
  console.log("Set metadata for initial token type");

  console.log(`Issuing tokens for ${friends.length} friends`);
  await cozyCoFriends.issueMemberships(friends, 0, {
    gasLimit: ethers.BigNumber.from(4730000),
  });
  console.log("Minted to friends");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
