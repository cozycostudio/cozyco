import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract } from "ethers";
import { ethers } from "hardhat";

import membershipList from "../data/membership-list.json";

describe("FriendsOfCozyCoMetadata contract", () => {
  let friendsOfCozyCoMetadata: Contract;
  let owner: SignerWithAddress;
  const name = "Friend of Cozy Co.";
  const desc =
    "A special card for exclusive access to cozy wares and discounts.";
  const image = "ipfs://QmddGvzRrAvhchqTB2h92UJrR4BXtZWAM2VhDFemwwkxH9";

  beforeEach(async () => {
    const FriendsOfCozyCoMetadata = await ethers.getContractFactory(
      "FriendsOfCozyCoMetadata"
    );
    [owner] = await ethers.getSigners();
    friendsOfCozyCoMetadata = await FriendsOfCozyCoMetadata.deploy(
      name,
      desc,
      image
    );
  });

  it("should set the correct metadata", async function () {
    expect(await friendsOfCozyCoMetadata.name()).to.equal(name);
    expect(await friendsOfCozyCoMetadata.description()).to.equal(desc);
    expect(await friendsOfCozyCoMetadata.imageURI()).to.equal(image);
    expect(await friendsOfCozyCoMetadata.animationURI()).to.equal("");
  });

  it("should set the correct owner", async () => {
    expect(await friendsOfCozyCoMetadata.owner()).to.equal(owner.address);
  });

  it("should set the token name", async () => {
    await friendsOfCozyCoMetadata.setName("Friends");
    expect(await friendsOfCozyCoMetadata.name()).to.equal("Friends");
  });

  it("should set the token description", async () => {
    await friendsOfCozyCoMetadata.setDescription("Cool token");
    expect(await friendsOfCozyCoMetadata.description()).to.equal("Cool token");
  });

  it("should set the token image", async () => {
    await friendsOfCozyCoMetadata.setImageURI("ipfs://foo");
    expect(await friendsOfCozyCoMetadata.imageURI()).to.equal("ipfs://foo");
  });

  it("should set the token animation", async () => {
    await friendsOfCozyCoMetadata.setAnimationURI("ipfs://bar");
    expect(await friendsOfCozyCoMetadata.animationURI()).to.equal("ipfs://bar");
  });

  it("should return the correct metadata", async () => {
    const token1 = await friendsOfCozyCoMetadata.getURI(0);
    const decoded1 = Buffer.from(token1.substring(29), "base64").toString();
    const one = JSON.parse(decoded1);
    expect(one.name).to.equal(name);
    expect(one.description).to.equal(desc);
    expect(one.image).to.equal(image);
    expect(one.animation_url).to.be.undefined;

    await friendsOfCozyCoMetadata.setAnimationURI(image);
    const token2 = await friendsOfCozyCoMetadata.getURI(0);
    const decoded2 = Buffer.from(token2.substring(29), "base64").toString();
    const two = JSON.parse(decoded2);
    expect(two.animation_url).to.equal(image);
  });
});

describe("CozyCoFriends contract", () => {
  let cozyCoFriends: Contract;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let metadata: Contract;

  beforeEach(async () => {
    const CozyCoFriends = await ethers.getContractFactory("CozyCoFriends");
    [owner, addr1, addr2] = await ethers.getSigners();
    cozyCoFriends = await CozyCoFriends.deploy();
    const Metadata = await ethers.getContractFactory("FriendsOfCozyCoMetadata");
    metadata = await Metadata.deploy("name", "desc", "ipfs://image");
    await cozyCoFriends.setTokenTypeMetadataAddress(0, metadata.address);
    await cozyCoFriends.setTokenTypeMetadataAddress(1, metadata.address);
  });

  describe("Deployment", () => {
    it("should set the correct owner", async () => {
      expect(await cozyCoFriends.owner()).to.equal(owner.address);
    });
  });

  describe("Roles", () => {
    it("should set the correct roles", async function () {
      const AdminRole = await cozyCoFriends.DEFAULT_ADMIN_ROLE();
      const IssuerRole = await cozyCoFriends.ISSUER_ROLE();
      const RevokerRole = await cozyCoFriends.REVOKER_ROLE();
      expect(await cozyCoFriends.getRoleMember(AdminRole, 0)).to.equal(
        owner.address
      );
      expect(await cozyCoFriends.getRoleMember(IssuerRole, 0)).to.equal(
        owner.address
      );
      expect(await cozyCoFriends.getRoleMember(RevokerRole, 0)).to.equal(
        owner.address
      );
    });

    it("should allow granting of new roles", async function () {
      const IssuerRole = await cozyCoFriends.ISSUER_ROLE();
      await cozyCoFriends.grantRole(IssuerRole, addr1.address);
      expect(await cozyCoFriends.getRoleMember(IssuerRole, 1)).to.equal(
        addr1.address
      );
    });

    it("should not allow issuers to grant roles", async function () {
      const IssuerRole = await cozyCoFriends.ISSUER_ROLE();
      await cozyCoFriends.grantRole(IssuerRole, addr1.address);
      expect(cozyCoFriends.connect(addr1).grantRole(IssuerRole, addr2.address))
        .to.be.reverted;
    });

    it("should not allow revokers to grant roles", async function () {
      const RevokerRole = await cozyCoFriends.REVOKER_ROLE();
      await cozyCoFriends.grantRole(RevokerRole, addr1.address);
      expect(cozyCoFriends.connect(addr1).grantRole(RevokerRole, addr2.address))
        .to.be.reverted;
    });
  });

  describe("Issuing", () => {
    it("should issue a membership", async () => {
      expect(await cozyCoFriends.issueMembership(addr1.address, 0))
        .to.emit(cozyCoFriends, "TransferSingle")
        .withArgs(
          owner.address,
          ethers.constants.AddressZero,
          addr1.address,
          0,
          1
        );
      expect(await cozyCoFriends.balanceOf(addr1.address, 0)).to.equal(1);
    });

    it("should issue a membership to many addresses", async () => {
      await cozyCoFriends.issueMemberships([addr1.address, addr2.address], 0);
      expect(await cozyCoFriends.balanceOf(addr1.address, 0)).to.equal(1);
      expect(await cozyCoFriends.balanceOf(addr2.address, 0)).to.equal(1);
    });

    it("should issue a membership to many addresses from the list", async () => {
      await cozyCoFriends.issueMemberships(membershipList, 0);
      expect(await cozyCoFriends.balanceOf(membershipList[0], 0)).to.equal(1);
      expect(await cozyCoFriends.balanceOf(membershipList[1], 0)).to.equal(1);
    });

    it("should not issue a membership if the token type has no metadata contract", async () => {
      expect(
        cozyCoFriends.issueMembership(addr1.address, 10)
      ).to.be.revertedWith("CozyCoFriends: no metadata");
    });

    it("should not issue a membership if the user already has one", async () => {
      // Issue the first membership token
      await cozyCoFriends.issueMembership(addr1.address, 0);
      // Try and issue another
      expect(
        cozyCoFriends.issueMembership(addr1.address, 0)
      ).to.be.revertedWith("Already a member");
    });

    it("should not issue a membership if a user already has one", async () => {
      // Issue one token to one address
      await cozyCoFriends.issueMembership(addr1.address, 0);
      // Try and issue to multiple addresses including the one above
      expect(
        cozyCoFriends.issueMemberships([addr1.address, addr2.address], 0)
      ).to.be.revertedWith("Already a member");
      expect(await cozyCoFriends.balanceOf(addr1.address, 0)).to.equal(1);
      expect(await cozyCoFriends.balanceOf(addr2.address, 0)).to.equal(0);
    });

    it("should issue memberships of different types", async () => {
      await cozyCoFriends.issueMemberships([addr1.address, addr2.address], 0);
      await cozyCoFriends.issueMemberships([addr1.address, addr2.address], 1);
      expect(await cozyCoFriends.balanceOf(addr1.address, 0)).to.equal(1);
      expect(await cozyCoFriends.balanceOf(addr1.address, 1)).to.equal(1);
      expect(await cozyCoFriends.balanceOf(addr2.address, 0)).to.equal(1);
      expect(await cozyCoFriends.balanceOf(addr2.address, 1)).to.equal(1);
    });
  });

  describe("Revoking", () => {
    it("should revoke a membership", async () => {
      // Issue initial memberships
      await cozyCoFriends.issueMemberships([addr1.address, addr2.address], 0);
      expect(await cozyCoFriends.balanceOf(addr1.address, 0)).to.equal(1);
      expect(await cozyCoFriends.balanceOf(addr2.address, 0)).to.equal(1);

      // Revoke from addr1
      await cozyCoFriends.revokeMembership(addr1.address, [0], [1]);
      expect(await cozyCoFriends.balanceOf(addr1.address, 0)).to.equal(0);
      expect(await cozyCoFriends.balanceOf(addr2.address, 0)).to.equal(1);
    });
  });

  describe("Metadata", () => {
    it("should get the metadata contract for a token type", async () => {
      expect(await cozyCoFriends.getTokenTypeMetadataAddress(0)).to.eql([
        true,
        metadata.address,
      ]);
    });

    it("should set a token metadata contract for a token type", async () => {
      const Metadata = await ethers.getContractFactory(
        "FriendsOfCozyCoMetadata"
      );
      const meta = await Metadata.deploy(
        "New Token Type",
        "A brand new token type",
        "ipfs://image"
      );
      await cozyCoFriends.setTokenTypeMetadataAddress(10, meta.address);
      expect(await cozyCoFriends.getTokenTypeMetadataAddress(10)).to.eql([
        true,
        meta.address,
      ]);
    });
  });
});
