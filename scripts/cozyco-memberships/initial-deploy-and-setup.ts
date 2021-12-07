import { ethers } from "hardhat";
import {
  memberships,
  membersList,
  merkleTree,
} from "../../tokens/cozyco-memberships";

async function main() {
  const INITIAL_MEMBERSHIP_ID = 1;
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy the metadata contract
  const CCMFriendsOfMetadata = await ethers.getContractFactory(
    "CCMFriendsOfMetadata"
  );
  const friendsOfCozyCoMetadata = await CCMFriendsOfMetadata.deploy(
    memberships.friendsOf.name,
    memberships.friendsOf.desc,
    memberships.friendsOf.imageURI,
    {
      gasLimit: ethers.BigNumber.from(910000),
    }
  );
  console.log("CCMFriendsOfMetadata.sol:", friendsOfCozyCoMetadata.address);

  // Deploy the main membership contract
  const CozyCoMembership = await ethers.getContractFactory("CozyCoMembership");
  const cozyCoMembership = await CozyCoMembership.deploy({
    gasLimit: ethers.BigNumber.from(2205000),
  });
  console.log("CozyCoMembership.sol:", cozyCoMembership.address);

  console.log(`Setting merkle root for ${membersList.length} friends`);
  const merkleRoot = merkleTree.getHexRoot();
  await cozyCoMembership.setMembershipMerkleRoot(
    merkleRoot,
    INITIAL_MEMBERSHIP_ID,
    {
      gasLimit: ethers.BigNumber.from(47000),
    }
  );

  console.log("Setting metadata for initial membership type");
  await cozyCoMembership.dangerouslySetMembershipMetadataAddress(
    INITIAL_MEMBERSHIP_ID,
    friendsOfCozyCoMetadata.address,
    {
      gasLimit: ethers.BigNumber.from(47000),
    }
  );

  console.log("All set up");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
