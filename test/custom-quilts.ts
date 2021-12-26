import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber, Contract } from "ethers";
import { ethers } from "hardhat";

interface Token {
  price: number;
  maxQuantity: number;
}
type TokenRecord = Record<number, Token>;
const tokens: TokenRecord = {
  1: { price: 10, maxQuantity: 10 },
  2: { price: 10, maxQuantity: 10 },
  3: { price: 10, maxQuantity: 10 },
  4: { price: 10, maxQuantity: 10 },
  5: { price: 10, maxQuantity: 10 },
};

interface TokenBundle {
  price: number;
  maxQuantity: number;
  packSize: number;
  tokenIds: number[];
}
type TokenBundleRecord = Record<number, TokenBundle>;
const tokenBundles: TokenBundleRecord = {
  10: { price: 20, maxQuantity: 10, packSize: 5, tokenIds: [1, 2, 3] },
  11: { price: 20, maxQuantity: 10, packSize: 10, tokenIds: [3, 4, 5] },
};

function getIds(type: "patch" | "bundle"): number[] {
  const data = type === "bundle" ? tokenBundles : tokens;
  return Object.keys(data).map((i) => Number(i));
}

function getPrices(type: "patch" | "bundle"): number[] {
  const data = type === "bundle" ? tokenBundles : tokens;
  return Object.entries(data).map(([_, { price }]) => price);
}

function getQuantities(type: "patch" | "bundle"): number[] {
  const data = type === "bundle" ? tokenBundles : tokens;
  return Object.entries(data).map(([_, { maxQuantity }]) => maxQuantity);
}

function getPackSizes(): number[] {
  return Object.entries(tokenBundles).map(([_, { packSize }]) => packSize);
}

function getPackTokenIds(): number[][] {
  return Object.entries(tokenBundles).map(([_, { tokenIds }]) => tokenIds);
}

function getTotalPriceForPurchase(
  type: "patch" | "bundle",
  ids: number[],
  amounts: number[]
) {
  const data = type === "bundle" ? tokenBundles : tokens;
  return ids.reduce((sum: number, id, index) => {
    const price = amounts[index] * data[id].price;
    return sum + price;
  }, 0);
}

function getMetadataIndexes(type: "patch" | "bundle") {
  const data = type === "bundle" ? tokenBundles : tokens;
  return Object.keys(data).map((_, idx) => idx);
}

describe("PatchesStockRoom contract", () => {
  let contract: Contract;
  let metadata: Contract;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  beforeEach(async () => {
    [owner, addr1, addr2] = await ethers.getSigners();
    const CozyCoMembership = await ethers.getContractFactory(
      "CozyCoMembership"
    );
    const cozyCoMembership = await CozyCoMembership.deploy();
    const PatchesBlankData = await ethers.getContractFactory(
      "PatchesBlankData"
    );
    metadata = await PatchesBlankData.deploy();
    const PatchesStockRoom = await ethers.getContractFactory(
      "PatchesStockRoom"
    );
    contract = await PatchesStockRoom.deploy(cozyCoMembership.address);
    const QuiltAssembly = await ethers.getContractFactory("QuiltAssembly");
    const customQuilts = await QuiltAssembly.deploy(
      cozyCoMembership.address,
      contract.address
    );
    await contract.setCustomQuiltsAddress(customQuilts.address);
    await contract.setMemberOpenState(true);
    await contract.setPublicOpenState(true);
  });

  it("should set the correct owner", async () => {
    expect(await contract.owner()).to.equal(owner.address);
  });

  describe("Tokens", () => {
    beforeEach(async () => {
      await contract.setTokens(
        getIds("patch"),
        metadata.address,
        getMetadataIndexes("patch"),
        getPrices("patch"),
        getQuantities("patch")
      );
    });

    it("should add new patches", async () => {
      expect(await contract.getTokenMetadataAddress(1)).to.equal(
        metadata.address
      );
      expect(await contract.getTokenPrice(1)).to.equal(tokens[1].price);
      expect(await contract.getTokenPrice(2)).to.equal(tokens[2].price);
      expect(await contract.getTokenMaxQuantity(1)).to.equal(
        tokens[1].maxQuantity
      );
      expect(await contract.getTokenMaxQuantity(2)).to.equal(
        tokens[2].maxQuantity
      );
    });

    it("should allow purchasing of patches", async () => {
      const ids = [1, 2, 3];
      const amounts = [
        tokens[1].maxQuantity,
        tokens[2].maxQuantity,
        tokens[3].maxQuantity,
      ];
      const totalPrice = getTotalPriceForPurchase("patch", ids, amounts);
      expect(
        await contract.purchaseTokens(ids, amounts, {
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
          ids.map((_) => owner.address),
          ids
        )
      ).to.eql([
        BigNumber.from(tokens[1].maxQuantity),
        BigNumber.from(tokens[2].maxQuantity),
        BigNumber.from(tokens[3].maxQuantity),
      ]);
    });

    it("should not allow purchasing patches over the max quantity", async () => {
      const ids = [1, 2, 3];
      const amounts = [
        tokens[1].maxQuantity + 5,
        tokens[2].maxQuantity,
        tokens[3].maxQuantity,
      ];
      const totalPrice = getTotalPriceForPurchase("patch", ids, amounts);
      expect(
        contract.purchaseTokens(ids, amounts, { value: totalPrice })
      ).to.be.revertedWith("out of stock");
    });
  });

  describe("Token bundle", () => {
    beforeEach(async () => {
      await contract.setTokenBundles(
        getIds("bundle"),
        metadata.address,
        getMetadataIndexes("bundle"),
        getPrices("bundle"),
        getPackSizes(),
        getQuantities("bundle"),
        getPackTokenIds()
      );
    });

    it("should add new token bundle", async () => {
      expect(await contract.getTokenMetadataAddress(10)).to.equal(
        metadata.address
      );
      expect(await contract.getTokenPrice(10)).to.equal(tokenBundles[10].price);
      expect(await contract.getTokenPrice(11)).to.equal(tokenBundles[11].price);
      expect(await contract.getTokenMaxQuantity(10)).to.equal(
        tokenBundles[10].maxQuantity
      );
      expect(await contract.getTokenMaxQuantity(11)).to.equal(
        tokenBundles[11].maxQuantity
      );
      expect(await contract.getTokenBundleSize(10)).to.equal(
        tokenBundles[10].packSize
      );
      expect(await contract.getTokenBundleSize(11)).to.equal(
        tokenBundles[11].packSize
      );
    });

    it("should allow purchasing of token bundles", async () => {
      const tokenIds = [10, 11];
      const amounts = [
        tokenBundles[10].maxQuantity,
        tokenBundles[11].maxQuantity,
      ];
      const totalPrice = getTotalPriceForPurchase("bundle", tokenIds, amounts);
      expect(
        await contract.purchaseTokens(tokenIds, amounts, {
          value: totalPrice,
        })
      )
        .to.emit(contract, "TransferBatch")
        .withArgs(
          owner.address,
          ethers.constants.AddressZero,
          owner.address,
          tokenIds,
          amounts
        );
      expect(
        await contract.balanceOfBatch(
          tokenIds.map((_) => owner.address),
          tokenIds
        )
      ).to.eql([
        BigNumber.from(tokenBundles[10].maxQuantity),
        BigNumber.from(tokenBundles[11].maxQuantity),
      ]);
    });

    it("should allow opening token bundle", async () => {
      const tokenIds = [10, 11];
      const amounts = [3, 3];
      const totalPrice = getTotalPriceForPurchase("bundle", tokenIds, amounts);
      await contract.purchaseTokens(tokenIds, amounts, {
        value: totalPrice,
      });

      await contract.openTokenBundles(tokenIds, amounts);
      expect(true).to.be.true;
      console.log(await contract.balanceOf(owner.address, 1));
      console.log(await contract.balanceOf(owner.address, 2));
      console.log(await contract.balanceOf(owner.address, 3));
      console.log(await contract.balanceOf(owner.address, 4));
      console.log(await contract.balanceOf(owner.address, 5));
    });
  });

  it.skip("should handle membership discounts", async () => {
    // await contract.addTokens(
    //   tokenIds,
    //   metadata.address,
    //   tokenPrices,
    //   tokenQuantities,
    //   0
    // );
    await contract.setMemberDiscounts(1, [1, 2, 3], [5000, 3000, 1000]);
    expect(await contract.getTokenMembershipDiscountBPS(1, 1)).to.equal(5000);
    expect(await contract.getTokenMembershipDiscountBPS(2, 1)).to.equal(3000);
    expect(await contract.getTokenMembershipDiscountBPS(3, 1)).to.equal(1000);
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
    // expect(data.attributes[0].value).to.equal("Single patch");
    // expect(data.attributes[1].value).to.equal("Quilt Stitcher");
    // expect(data.attributes[2].value).to.equal("Blanks");
    // expect(data.attributes[3].value).to.equal("1x1");
  });
});

describe.only("QuiltAssembly contract", () => {
  let contract: Contract;
  let storefront: Contract;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  beforeEach(async () => {
    [owner, addr1, addr2] = await ethers.getSigners();
    const CozyCoMembership = await ethers.getContractFactory(
      "CozyCoMembership"
    );
    const cozyCoMembership = await CozyCoMembership.deploy();
    const PatchesBlankData = await ethers.getContractFactory(
      "PatchesBlankData"
    );
    const metadata = await PatchesBlankData.deploy();
    const PatchesStockRoom = await ethers.getContractFactory(
      "PatchesStockRoom"
    );
    storefront = await PatchesStockRoom.deploy(cozyCoMembership.address);
    const QuiltAssembly = await ethers.getContractFactory("QuiltAssembly");
    contract = await QuiltAssembly.deploy(
      cozyCoMembership.address,
      storefront.address
    );
    await storefront.setCustomQuiltsAddress(contract.address);
    await storefront.setMemberOpenState(true);
    await storefront.setPublicOpenState(true);
    await storefront.setTokens(
      getIds("patch"),
      metadata.address,
      getMetadataIndexes("patch"),
      getPrices("patch"),
      getQuantities("patch")
    );
    const ids = [1, 2, 3];
    const amounts = [
      tokens[1].maxQuantity,
      tokens[2].maxQuantity,
      tokens[3].maxQuantity,
    ];
    const totalPrice = getTotalPriceForPurchase("patch", ids, amounts);
    await storefront.connect(addr1).purchaseTokens(ids, amounts, {
      value: totalPrice,
    });
  });

  it("should create a quilt", async () => {
    const price = await contract.creationCost();
    console.log(await storefront.balanceOf(addr1.address, 1));
    console.log(await storefront.balanceOf(addr1.address, 2));
    console.log(await storefront.balanceOf(addr1.address, 3));

    await contract.connect(addr1).createQuilt([1, 2, 3], { value: price });

    console.log(await storefront.balanceOf(addr1.address, 1));
    console.log(await storefront.balanceOf(addr1.address, 2));
    console.log(await storefront.balanceOf(addr1.address, 3));

    expect(true).to.be.true;

    console.log(await contract.connect(addr1).tokenURI(1));
  });
});
