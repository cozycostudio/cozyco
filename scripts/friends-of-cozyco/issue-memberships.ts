import { ethers } from "hardhat";

import friends from "../../data/membership-list.json";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Adding members from:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const mainContractAddress = "0x225CD7d1ed9132400E77ba7A898f1426bdFa1f93";
  const CozyCoMembership = await ethers.getContractFactory("CozyCoMembership");
  const contract = CozyCoMembership.attach(mainContractAddress);

  await contract.issueMemberships(friends, 1, {
    gasLimit: ethers.BigNumber.from(4730000),
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
