import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber, Contract } from "ethers";
import { ethers } from "hardhat";

const quantities = [10, 20, 30, 40, 50, 60];
const prices = [10, 20, 30, 40, 50, 60];

function getTotalPrice(ids: number[], amounts: number[]) {
  return ids.reduce((sum: number, id, index) => {
    const price = amounts[index] * prices[id - 1];
    return sum + price;
  }, 0);
}

describe("PatchesStorefront contract", () => {
  let contract: Contract;
  let metadata: Contract;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  beforeEach(async () => {
    [owner, addr1, addr2] = await ethers.getSigners();
    const PatchesBlankData = await ethers.getContractFactory(
      "PatchesBlankData"
    );
    metadata = await PatchesBlankData.deploy();
    const PatchesStorefront = await ethers.getContractFactory(
      "PatchesStorefront"
    );
    contract = await PatchesStorefront.deploy();
  });

  it.skip("should set the correct info", async function () {});

  it("should set the correct owner", async () => {
    expect(await contract.owner()).to.equal(owner.address);
  });

  it("should add new patches", async () => {
    await contract.addPatches(metadata.address, quantities, prices, 0);
    expect(await contract.getPatchMetadataAddress(1)).to.equal(
      metadata.address
    );
    expect(await contract.getPatchMaxQuantity(1)).to.equal(quantities[0]);
    expect(await contract.getPatchMaxQuantity(2)).to.equal(quantities[1]);
    expect(await contract.getPatchPartIndex(5)).to.equal(4);
  });

  it("should allow purchasing of patches", async () => {
    await contract.addPatches(metadata.address, quantities, prices, 0);
    const ids = [1, 2, 3];
    const amounts = [2, 4, 2];
    const totalPrice = getTotalPrice(ids, amounts);
    expect(
      await contract.purchasePatches(ids, amounts, {
        value: totalPrice,
      })
    )
      .to.emit(contract, "TransferBatch")
      .withArgs(
        owner.address,
        ethers.constants.AddressZero,
        owner.address,
        ids,
        amounts
      );
    expect(
      await contract.balanceOfBatch(
        [owner.address, owner.address, owner.address],
        ids
      )
    ).to.eql([BigNumber.from(2), BigNumber.from(4), BigNumber.from(2)]);
  });

  it("should not allow purchasing patches over the max quantity", async () => {
    await contract.addPatches(metadata.address, quantities, prices, 0);
    const ids = [1, 2, 3];
    const amounts = [2, 100, 11];
    const totalPrice = getTotalPrice(ids, amounts);
    expect(
      contract.purchasePatches(ids, amounts, { value: totalPrice })
    ).to.be.revertedWith("out of stock");
  });
});

describe("PatchesBlankData contract", () => {
  let contract: Contract;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  beforeEach(async () => {
    [owner, addr1, addr2] = await ethers.getSigners();
    const PatchesBlankData = await ethers.getContractFactory(
      "PatchesBlankData"
    );
    contract = await PatchesBlankData.deploy();
  });

  it("should return token metadata", async () => {
    const token = await contract.tokenURI(0);
    const decoded = Buffer.from(token.substring(29), "base64").toString();
    const data = JSON.parse(decoded);
    expect(data.name).to.equal("Blank patch #1");
    expect(data.description).to.equal(
      "A blank patch, perfect for filling in the gaps in a custom quilt."
    );
    expect(data.attributes[0].value).to.equal("Quilt Stitcher");
    expect(data.attributes[1].value).to.equal("Blanks");
    expect(data.attributes[2].value).to.equal("1x1");
  });
});
