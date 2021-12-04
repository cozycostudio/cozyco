import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract } from "ethers";
import { ethers } from "hardhat";

import membershipList from "../data/membership-list.json";

const name = "Friend of cozy co.";
const desc = "A special card for exclusive access to cozy wares and discounts.";
const imageURI = "ipfs://QmddGvzRrAvhchqTB2h92UJrR4BXtZWAM2VhDFemwwkxH9";

describe("FriendsOfCozyCoMetadata contract", () => {
  let friendsOfCozyCoMetadata: Contract;
  let owner: SignerWithAddress;

  beforeEach(async () => {
    const FriendsOfCozyCoMetadata = await ethers.getContractFactory(
      "FriendsOfCozyCoMetadata"
    );
    [owner] = await ethers.getSigners();
    friendsOfCozyCoMetadata = await FriendsOfCozyCoMetadata.deploy(
      name,
      desc,
      imageURI
    );
  });

  it("should set the correct metadata", async function () {
    expect(await friendsOfCozyCoMetadata.name()).to.equal(name);
    expect(await friendsOfCozyCoMetadata.description()).to.equal(desc);
    expect(await friendsOfCozyCoMetadata.imageURI()).to.equal(imageURI);
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
    expect(one.image).to.equal(imageURI);
    expect(one.animation_url).to.be.undefined;

    await friendsOfCozyCoMetadata.setAnimationURI(imageURI);
    const token2 = await friendsOfCozyCoMetadata.getURI(0);
    const decoded2 = Buffer.from(token2.substring(29), "base64").toString();
    const two = JSON.parse(decoded2);
    expect(two.animation_url).to.equal(imageURI);
  });
});

describe("CozyCoMembership contract", () => {
  let cozyCoMembership: Contract;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let metadata: Contract;

  beforeEach(async () => {
    const CozyCoMembership = await ethers.getContractFactory(
      "CozyCoMembership"
    );
    [owner, addr1, addr2] = await ethers.getSigners();
    cozyCoMembership = await CozyCoMembership.deploy();
    const Metadata = await ethers.getContractFactory("FriendsOfCozyCoMetadata");
    metadata = await Metadata.deploy(name, desc, imageURI);
    await cozyCoMembership.addMembershipMetadataAddress(0, metadata.address);
    await cozyCoMembership.addMembershipMetadataAddress(1, metadata.address);
  });

  describe.only("Deployment", () => {
    it("should set the correct owner", async () => {
      expect(await cozyCoMembership.owner()).to.equal(owner.address);
    });
  });

  describe("Issuing", () => {
    it("should issue a membership", async () => {
      expect(await cozyCoMembership.issueMembership(addr1.address, 0))
        .to.emit(cozyCoMembership, "TransferSingle")
        .withArgs(
          owner.address,
          ethers.constants.AddressZero,
          addr1.address,
          0,
          1
        );
      expect(await cozyCoMembership.balanceOf(addr1.address, 0)).to.equal(1);
    });

    it("should issue a membership to many addresses", async () => {
      await cozyCoMembership.issueMemberships(
        [addr1.address, addr2.address],
        0
      );
      expect(await cozyCoMembership.balanceOf(addr1.address, 0)).to.equal(1);
      expect(await cozyCoMembership.balanceOf(addr2.address, 0)).to.equal(1);
    });

    it.only("should issue a membership to many addresses from the list", async () => {
      console.log(`Issuing tokens for ${membershipList.length} friends`);
      await cozyCoMembership.issueMemberships(membershipList, 0);
      expect(await cozyCoMembership.balanceOf(membershipList[0], 0)).to.equal(
        1
      );
      expect(await cozyCoMembership.balanceOf(membershipList[1], 0)).to.equal(
        1
      );
    });

    it("should not issue a membership if the token type has no metadata contract", async () => {
      expect(
        cozyCoMembership.issueMembership(addr1.address, 10)
      ).to.be.revertedWith("CozyCoMembership: no metadata");
    });

    it("should not issue a membership if the user already has one", async () => {
      // Issue the first membership token
      await cozyCoMembership.issueMembership(addr1.address, 0);
      // Try and issue another
      expect(
        cozyCoMembership.issueMembership(addr1.address, 0)
      ).to.be.revertedWith("CozyCoMembership: already member");
    });

    it("should not issue a membership if a user already has one", async () => {
      // Issue one token to one address
      await cozyCoMembership.issueMembership(addr1.address, 0);
      // Try and issue to multiple addresses including the one above
      expect(
        cozyCoMembership.issueMemberships([addr1.address, addr2.address], 0)
      ).to.be.revertedWith("CozyCoMembership: already member");
      expect(await cozyCoMembership.balanceOf(addr1.address, 0)).to.equal(1);
      expect(await cozyCoMembership.balanceOf(addr2.address, 0)).to.equal(0);
    });

    it("should issue memberships of different types", async () => {
      await cozyCoMembership.issueMemberships(
        [addr1.address, addr2.address],
        0
      );
      await cozyCoMembership.issueMemberships(
        [addr1.address, addr2.address],
        1
      );
      expect(await cozyCoMembership.balanceOf(addr1.address, 0)).to.equal(1);
      expect(await cozyCoMembership.balanceOf(addr1.address, 1)).to.equal(1);
      expect(await cozyCoMembership.balanceOf(addr2.address, 0)).to.equal(1);
      expect(await cozyCoMembership.balanceOf(addr2.address, 1)).to.equal(1);
    });
  });

  describe("Revoking", () => {
    it("should revoke a membership", async () => {
      // Issue initial memberships
      await cozyCoMembership.issueMemberships(
        [addr1.address, addr2.address],
        0
      );
      expect(await cozyCoMembership.balanceOf(addr1.address, 0)).to.equal(1);
      expect(await cozyCoMembership.balanceOf(addr2.address, 0)).to.equal(1);

      // Revoke from addr1
      await cozyCoMembership.revokeMembership(addr1.address, [0], [1]);
      expect(await cozyCoMembership.balanceOf(addr1.address, 0)).to.equal(0);
      expect(await cozyCoMembership.balanceOf(addr2.address, 0)).to.equal(1);
    });
  });

  describe("Metadata", () => {
    it("should get the metadata contract for a token type", async () => {
      expect(await cozyCoMembership.getMembershipMetadataAddress(0)).to.equal(
        metadata.address
      );
    });

    it("should add the metadata contract for a token type", async () => {
      const Metadata = await ethers.getContractFactory(
        "FriendsOfCozyCoMetadata"
      );
      const meta = await Metadata.deploy(
        "New Token Type",
        "A brand new token type",
        "ipfs://image"
      );
      await cozyCoMembership.addMembershipMetadataAddress(10, meta.address);
      expect(await cozyCoMembership.getMembershipMetadataAddress(10)).to.equal(
        meta.address
      );
    });

    it("should not add the metadata contract if it's already been set", async () => {
      expect(
        cozyCoMembership.addMembershipMetadataAddress(0, metadata.address)
      ).to.be.revertedWith("CozyCoMembership: tokenId in use");
    });

    it("should add the metadata contract for a token type", async () => {
      expect(await cozyCoMembership.getMembershipMetadataAddress(0)).to.equal(
        metadata.address
      );
      const Metadata = await ethers.getContractFactory(
        "FriendsOfCozyCoMetadata"
      );
      const meta = await Metadata.deploy(
        "New Token Type",
        "A brand new token type",
        "ipfs://image"
      );
      await cozyCoMembership.updateMembershipMetadataAddress(0, meta.address);
      expect(await cozyCoMembership.getMembershipMetadataAddress(0)).to.equal(
        meta.address
      );
    });
  });
});
