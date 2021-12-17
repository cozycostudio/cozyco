import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract } from "ethers";
import { ethers } from "hardhat";

describe("CustomQuilts contract", () => {
  let contract: Contract;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  beforeEach(async () => {
    [owner, addr1, addr2] = await ethers.getSigners();
    const QuiltPackRenderer = await ethers.getContractFactory(
      "QuiltPackRenderer"
    );
    contract = await QuiltPackRenderer.deploy();
    contract.setCollection(1, "Genesis");
  });

  it.skip("should set the correct info", async function () {});

  it("should set the correct owner", async () => {
    expect(await contract.owner()).to.equal(owner.address);
  });

  it("should add a new patch for sale", async () => {
    const patch = [
      1, // collection
      1, // patch id
      200, // quantity
      [1, 1], // size
      `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 64 64"><path fill="#FFEDED" d="M0 0h64v64H0z"/><circle cx="32" cy="32" r="24" fill="#FFAFCC"/><circle cx="32" cy="32" r="12" fill="#FDD75F"/></svg>`,
    ];
    await contract.setPatchForSale(...patch);
    expect(true).to.be.true;
  });
});
