import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const CozyCoSeasonsGreetings = await ethers.getContractFactory(
    "CozyCoSeasonsGreetings"
  );
  const contract = await CozyCoSeasonsGreetings.deploy(
    "https://cozyco.studio/api/seasons-greetings/image",
    "https://cozyco.studio/api/seasons-greetings/animation_url",
    "0xed269d608f6ec4adffca4ea8152ee7df66c25e94", // rinkeby
    // "0xbfE56434Ff917d8eB42677d06C0Be2b57EA79F3a", // mainnet
    {
      gasLimit: ethers.BigNumber.from(2570000),
    }
  );
  console.log("CozyCoSeasonsGreetings deployed to:", contract.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
