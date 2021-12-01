import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Adding token type from:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const mainContractAddress = "0x225CD7d1ed9132400E77ba7A898f1426bdFa1f93";
  const CozyCoFriends = await ethers.getContractFactory("CozyCoFriends");
  const contract = CozyCoFriends.attach(mainContractAddress);

  await contract.setTokenTypeMetadataAddress(
    0,
    "0x4288Ce24176D9475DfCedfF5a80b1e523571d17b"
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
