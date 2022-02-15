import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract } from "ethers";
import { ethers } from "hardhat";

describe("Quilts contract", () => {
  let quilts: Contract;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;

  beforeEach(async () => {
    const QuiltGenerator = await ethers.getContractFactory("QuiltGenerator");
    const quiltGenerator = await QuiltGenerator.deploy();
    const Quilts = await ethers.getContractFactory("Quilts", {
      libraries: {
        QuiltGenerator: quiltGenerator.address,
      },
    });
    [owner, addr1] = await ethers.getSigners();
    quilts = await Quilts.deploy();
  });

  describe("Deployment", () => {
    it("should initialise Quilts contract", async () => {
      expect(await quilts.name()).to.equal("Quilts");
      expect(await quilts.symbol()).to.equal("QLTS");
      expect(await quilts.MAX_SUPPLY()).to.equal(4000);
      expect(await quilts.MAX_PER_TX()).to.equal(10);
      expect(await quilts.MAX_PER_ADDRESS()).to.equal(20);
      expect(await quilts.tokensMinted()).to.equal(0);
      expect(await quilts.isSaleActive()).to.equal(false);
    });

    it("should set the correct owner", async () => {
      expect(await quilts.owner()).to.equal(owner.address);
    });

    it("should assign the total supply of tokens to the owner", async function () {
      const ownerBalance = await quilts.balanceOf(owner.address);
      expect(await quilts.totalSupply()).to.equal(ownerBalance);
    });
  });

  describe("Minting", () => {
    it("should mint a quilt", async () => {
      await quilts.toggleSale();
      const price = await quilts.PRICE();
      expect(await quilts.connect(addr1).claim(1, { value: price }))
        .to.emit(quilts, "Transfer")
        .withArgs(ethers.constants.AddressZero, addr1.address, 1);
      expect(await quilts.balanceOf(addr1.address)).to.equal(1);
      expect(await quilts.tokensMinted()).to.equal(1);

      const tokenURI = await quilts.tokenURI(1);
      const decoded = Buffer.from(tokenURI.substring(29), "base64").toString();
      const data = JSON.parse(decoded);

      expect(data.name).to.equal("Quilt #1");
      expect(data.description).to.equal(
        "Generative cozy quilts stitched on-chain and stored on the Ethereum network, forever."
      );
      expect(data.attributes[0].value).to.equal("Electric");
      expect(data.attributes[1].value).to.equal("No");
      expect(data.attributes[2].value).to.equal("Pumpkin");
      expect(data.attributes[3].value).to.equal("Mint tea");
      expect(data.attributes[4].value).to.eql([
        "Crashing waves",
        "Bengal",
        "Bengal",
        "Quilty",
        "Maiz",
        "Sunbeam",
        "Equilibrium",
        "Quilty",
        "Highlands",
        "Spires",
        "Maiz",
        "Pinwheel",
        "Log cabin",
        "Flying geese",
        "Maiz",
      ]);
      expect(data.attributes[5].value).to.equal("No");
      expect(data.attributes[6].value).to.equal(15);
      expect(data.attributes[7].value).to.equal("5:3");
      expect(data.attributes[8].value).to.equal("Wavey");
      expect(data.attributes[9].value).to.equal("No");
      expect(data.attributes[10].value).to.equal(16);
    });

    it("should allow the owner to pre-mint 10 tokens", async () => {
      expect(await quilts.stitcherClaim())
        .to.emit(quilts, "Transfer")
        .withArgs(ethers.constants.AddressZero, owner.address, 10);
      expect(await quilts.balanceOf(owner.address)).to.equal(10);
      expect(await quilts.tokensMinted()).to.equal(10);

      // It should fail if the owner mints more than 10
      expect(quilts.stitcherClaim()).to.be.revertedWith(
        "Stitcher already claimed quilts"
      );
      expect(await quilts.balanceOf(owner.address)).to.equal(10);
    });

    it("should not load tokens that have not been minted", async () => {
      // Token 1 has not been minted yet so should fail
      expect(quilts.tokenURI(1)).to.be.revertedWith("Invalid token ID");

      // Enable the sale and mint token 1
      await quilts.toggleSale();
      const price = await quilts.PRICE();
      expect(await quilts.connect(addr1).claim(1, { value: price }))
        .to.emit(quilts, "Transfer")
        .withArgs(ethers.constants.AddressZero, addr1.address, 1);

      // Check token one is correct
      const tokenURI = await quilts.tokenURI(1);
      const decoded = Buffer.from(tokenURI.substring(29), "base64").toString();
      const data = JSON.parse(decoded);
      expect(data.name).to.equal("Quilt #1");

      // Getting token 2 should fail
      expect(quilts.tokenURI(2)).to.be.revertedWith("Invalid token ID");
    });

    it("should fail if the sale is not active", async () => {
      const price = await quilts.PRICE();
      expect(
        quilts.connect(addr1).claim(1, { value: price })
      ).to.be.revertedWith("Sale not active");
      expect(await quilts.balanceOf(addr1.address)).to.equal(0);
    });

    it("should fail when minting more than 20 tokens", async () => {
      await quilts.toggleSale();
      const price = await quilts.PRICE();
      expect(
        quilts.connect(addr1).claim(11, { value: price.mul(11) })
      ).to.be.revertedWith("Mint fewer quilts");
      expect(await quilts.balanceOf(addr1.address)).to.equal(0);
    });

    it("should fail if an address mints more than the limit of tokens per address", async () => {
      await quilts.toggleSale();
      const price = await quilts.PRICE();
      expect(quilts.claim(10, { value: price.mul(10) }))
        .to.emit(quilts, "Transfer")
        .withArgs(ethers.constants.AddressZero, owner.address, 10);
      expect(await quilts.balanceOf(owner.address)).to.equal(10);

      // Claim 10 more, should be at the limit
      await quilts.claim(10, { value: price.mul(10) });
      expect(await quilts.balanceOf(owner.address)).to.equal(20);

      // Claiming any more should error
      expect(quilts.claim(1, { value: price })).to.be.revertedWith(
        "Exceeds wallet limit"
      );
    });

    it("should fail when minting 0 tokens", async () => {
      await quilts.toggleSale();
      const price = await quilts.PRICE();
      expect(
        quilts.connect(addr1).claim(0, { value: price.mul(0) })
      ).to.be.revertedWith("Must mint at least 1 quilt");
      expect(await quilts.balanceOf(addr1.address)).to.equal(0);
    });

    it("should fail when the mint price is incorrect", async () => {
      await quilts.toggleSale();
      const price = await quilts.PRICE();
      expect(
        quilts.connect(addr1).claim(2, { value: price.mul(1) })
      ).to.be.revertedWith("ETH amount is incorrect");
      expect(await quilts.balanceOf(addr1.address)).to.equal(0);
    });
  });

  describe("TokenURI", () => {
    it("should fail when trying to get out of bounds token data", async () => {
      expect(quilts.tokenURI(4001)).to.be.revertedWith("Invalid token ID");
    });
  });

  describe("Transfers", () => {
    it("should transfer tokens between accounts", async () => {
      await quilts.toggleSale();
      const price = await quilts.PRICE();

      // Mint 10 tokens to owner
      await quilts.claim(10, { value: price.mul(10) });
      expect(await quilts.balanceOf(owner.address)).to.equal(10);

      // Transfer some tokens
      await quilts.transferFrom(owner.address, addr1.address, 1);
      expect(await quilts.balanceOf(addr1.address)).to.equal(1);
      expect(await quilts.balanceOf(owner.address)).to.equal(9);
    });
  });
});
