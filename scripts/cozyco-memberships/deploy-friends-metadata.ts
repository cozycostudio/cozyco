import { ethers } from "hardhat";
import { memberships } from "../../tokens/cozyco-memberships";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const CCMFriendsOfMetadata = await ethers.getContractFactory(
    "CCMFriendsOfMetadata"
  );
  const contract = await CCMFriendsOfMetadata.deploy(
    memberships.friendsOf.name,
    memberships.friendsOf.desc,
    memberships.friendsOf.imageURI,
    {
      gasLimit: ethers.BigNumber.from(910000),
    }
  );
  console.log("CCMFriendsOfMetadata deployed to:", contract.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
