import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const mainContractAddress = "0xbfE56434Ff917d8eB42677d06C0Be2b57EA79F3a";
  const CozyCoMembership = await ethers.getContractFactory("CozyCoMembership");
  const contract = CozyCoMembership.attach(mainContractAddress);

  console.log("Setting metadata for initial membership type");
  await contract.dangerouslySetMembershipMetadataAddress(
    1,
    "0xc69629C6f34EA03BcD9A311F98B0aB5778f6A555",
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
