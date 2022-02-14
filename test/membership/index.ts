import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract } from "ethers";
import { ethers } from "hardhat";
import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";
import { memberships } from "../../tokens/cozyco-memberships";

describe("CCMFriendsOfMetadata contract", () => {
  let ccmFriendsOfMetadata: Contract;
  let owner: SignerWithAddress;

  beforeEach(async () => {
    const CCMFriendsOfMetadata = await ethers.getContractFactory(
      "CCMFriendsOfMetadata"
    );
    [owner] = await ethers.getSigners();
    ccmFriendsOfMetadata = await CCMFriendsOfMetadata.deploy(
      memberships.friendsOf.name,
      memberships.friendsOf.desc,
      memberships.friendsOf.imageURI
    );
  });

  it.only("should set the correct metadata", async function () {
    expect(await ccmFriendsOfMetadata.name()).to.equal(
      memberships.friendsOf.name
    );
    expect(await ccmFriendsOfMetadata.description()).to.equal(
      memberships.friendsOf.desc
    );
    expect(await ccmFriendsOfMetadata.imageURI()).to.equal(
      memberships.friendsOf.imageURI
    );
    expect(await ccmFriendsOfMetadata.animationURI()).to.equal("");
  });

  it("should set the correct owner", async () => {
    expect(await ccmFriendsOfMetadata.owner()).to.equal(owner.address);
  });

  it("should set the token name", async () => {
    await ccmFriendsOfMetadata.setName("Friends");
    expect(await ccmFriendsOfMetadata.name()).to.equal("Friends");
  });

  it("should set the token description", async () => {
    await ccmFriendsOfMetadata.setDescription("Cool token");
    expect(await ccmFriendsOfMetadata.description()).to.equal("Cool token");
  });

  it("should set the token image", async () => {
    await ccmFriendsOfMetadata.setImageURI("ipfs://foo");
    expect(await ccmFriendsOfMetadata.imageURI()).to.equal("ipfs://foo");
  });

  it("should set the token animation", async () => {
    await ccmFriendsOfMetadata.setAnimationURI("ipfs://bar");
    expect(await ccmFriendsOfMetadata.animationURI()).to.equal("ipfs://bar");
  });

  it("should return the correct metadata", async () => {
    const token1 = await ccmFriendsOfMetadata.getURI(0);
    const decoded1 = Buffer.from(token1.substring(29), "base64").toString();
    const one = JSON.parse(decoded1);
    expect(one.name).to.equal(memberships.friendsOf.name);
    expect(one.description).to.equal(memberships.friendsOf.desc);
    expect(one.image).to.equal(memberships.friendsOf.imageURI);
    expect(one.animation_url).to.be.undefined;

    await ccmFriendsOfMetadata.setAnimationURI(memberships.friendsOf.imageURI);
    const token2 = await ccmFriendsOfMetadata.getURI(0);
    const decoded2 = Buffer.from(token2.substring(29), "base64").toString();
    const two = JSON.parse(decoded2);
    expect(two.animation_url).to.equal(memberships.friendsOf.imageURI);
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
    const Metadata = await ethers.getContractFactory("CCMFriendsOfMetadata");
    metadata = await Metadata.deploy(
      memberships.friendsOf.name,
      memberships.friendsOf.desc,
      memberships.friendsOf.imageURI
    );
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

    it("should not issue a membership if the membershipId has no metadata contract", async () => {
      expect(
        cozyCoMembership.issueMembership(addr1.address, 10)
      ).to.be.revertedWith("no metadata");
    });

    it("should not issue a membership if the user already has one", async () => {
      // Issue the first membership token
      await cozyCoMembership.issueMembership(addr1.address, 0);
      // Try and issue another
      expect(
        cozyCoMembership.issueMembership(addr1.address, 0)
      ).to.be.revertedWith("already member");
    });

    it("should not issue a membership if a user already has one", async () => {
      // Issue one token to one address
      await cozyCoMembership.issueMembership(addr1.address, 0);
      // Try and issue to multiple addresses including the one above
      expect(
        cozyCoMembership.issueMemberships([addr1.address, addr2.address], 0)
      ).to.be.revertedWith("already member");
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

  describe("Proofed list claims", () => {
    it("should set the merkle root for a membershipId", async () => {
      const merkleTree = new MerkleTree(
        [owner.address, addr1.address],
        keccak256,
        { hashLeaves: true, sortPairs: true }
      );
      const root = merkleTree.getHexRoot();
      await cozyCoMembership.setMembershipMerkleRoot(root, 0);
      expect(await cozyCoMembership.getMembershipMerkleRoot(0)).to.equal(root);
    });

    it("should allow someone to claim with a proof list", async () => {
      const merkleTree = new MerkleTree(
        [owner.address, addr1.address],
        keccak256,
        { hashLeaves: true, sortPairs: true }
      );
      const root = merkleTree.getHexRoot();
      await cozyCoMembership.setMembershipMerkleRoot(root, 0);
      const proof = merkleTree.getHexProof(keccak256(addr1.address));

      expect(await cozyCoMembership.connect(addr1).joinCozyCo(proof, 0))
        .to.emit(cozyCoMembership, "TransferSingle")
        .withArgs(
          addr1.address,
          ethers.constants.AddressZero,
          addr1.address,
          0,
          1
        );
    });

    it("should allow anyone to claim if there is no merkle tree", async () => {
      const merkleTree = new MerkleTree([addr1.address], keccak256, {
        hashLeaves: true,
        sortPairs: true,
      });
      const proof = merkleTree.getHexProof(keccak256(addr2.address));

      expect(await cozyCoMembership.connect(addr1).joinCozyCo(proof, 0))
        .to.emit(cozyCoMembership, "TransferSingle")
        .withArgs(
          addr1.address,
          ethers.constants.AddressZero,
          addr1.address,
          0,
          1
        );
    });

    it("should not allow claiming if sender is not in the merkle tree", async () => {
      const merkleTree = new MerkleTree(
        [owner.address, addr1.address],
        keccak256,
        { hashLeaves: true, sortPairs: true }
      );
      const root = merkleTree.getHexRoot();
      await cozyCoMembership.setMembershipMerkleRoot(root, 0);
      const proof = merkleTree.getHexProof(keccak256(addr2.address));

      expect(
        cozyCoMembership.connect(addr1).joinCozyCo(proof, 0)
      ).to.be.revertedWith("not claimable for address");
    });

    it("should not allow someone to claim if they've already claimed", async () => {
      const merkleTree = new MerkleTree(
        [owner.address, addr1.address],
        keccak256,
        { hashLeaves: true, sortPairs: true }
      );
      const root = merkleTree.getHexRoot();
      await cozyCoMembership.setMembershipMerkleRoot(root, 0);
      const proof = merkleTree.getHexProof(keccak256(addr1.address));

      // join once
      await cozyCoMembership.connect(addr1).joinCozyCo(proof, 0);

      // try and join again
      expect(
        cozyCoMembership.connect(addr1).joinCozyCo(proof, 0)
      ).to.be.revertedWith("already member");
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
      await cozyCoMembership.revokeMembership(addr1.address, [0], [1], false);
      expect(await cozyCoMembership.balanceOf(addr1.address, 0)).to.equal(0);
      expect(await cozyCoMembership.balanceOf(addr2.address, 0)).to.equal(1);
    });

    it("should allow re-claiming when revoking a membership", async () => {
      // Issue initial memberships
      await cozyCoMembership.issueMemberships(
        [addr1.address, addr2.address],
        0
      );
      expect(await cozyCoMembership.balanceOf(addr1.address, 0)).to.equal(1);
      expect(await cozyCoMembership.balanceOf(addr2.address, 0)).to.equal(1);

      // Revoke from addr1
      await cozyCoMembership.revokeMembership(addr1.address, [0], [1], true);
      expect(await cozyCoMembership.balanceOf(addr1.address, 0)).to.equal(0);
      expect(await cozyCoMembership.balanceOf(addr2.address, 0)).to.equal(1);

      // addr1 should be allowed to reclaim now
      expect(await cozyCoMembership.issueMembership(addr1.address, 0))
        .to.emit(cozyCoMembership, "TransferSingle")
        .withArgs(
          owner.address,
          ethers.constants.AddressZero,
          addr1.address,
          0,
          1
        );
    });
  });

  describe("Metadata", () => {
    it("should get the metadata contract for a membershipId", async () => {
      expect(await cozyCoMembership.getMembershipMetadataAddress(0)).to.equal(
        metadata.address
      );
    });

    it("should add the metadata contract for a membershipId", async () => {
      const Metadata = await ethers.getContractFactory("CCMFriendsOfMetadata");
      const meta = await Metadata.deploy(
        "New membershipId",
        "A brand new membershipId",
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
      ).to.be.revertedWith("membershipId in use");
    });

    it("should explicitly update the metadata contract for a membershipId", async () => {
      expect(await cozyCoMembership.getMembershipMetadataAddress(0)).to.equal(
        metadata.address
      );
      const Metadata = await ethers.getContractFactory("CCMFriendsOfMetadata");
      const meta = await Metadata.deploy(
        "New membershipId",
        "A brand new membershipId",
        "ipfs://image"
      );
      await cozyCoMembership.dangerouslySetMembershipMetadataAddress(
        0,
        meta.address
      );
      expect(await cozyCoMembership.getMembershipMetadataAddress(0)).to.equal(
        meta.address
      );
    });
  });
});
