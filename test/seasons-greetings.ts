import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract } from "ethers";
import { ethers } from "hardhat";

const name = "cozy co. greetings card";
const desc =
  "send a greetings card to a friend this season and spread the cozy vibes";
const image = "https://cozyco.studio/api/seasons-greetings/image";
const animationURL =
  "https://cozyco.studio/api/seasons-greetings/animation_url";

describe("CozyCoSeasonsGreetings contract", () => {
  let contract: Contract;
  let membershipContract: Contract;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  beforeEach(async () => {
    [owner, addr1, addr2] = await ethers.getSigners();
    const CozyCoMembership = await ethers.getContractFactory(
      "CozyCoMembership"
    );
    membershipContract = await CozyCoMembership.deploy();
    const Metadata = await ethers.getContractFactory("CCMFriendsOfMetadata");
    const metadata = await Metadata.deploy("Name", "Description", "Image");
    await membershipContract.addMembershipMetadataAddress(1, metadata.address);
    const CozySeasonsGreetings = await ethers.getContractFactory(
      "CozyCoSeasonsGreetings"
    );
    contract = await CozySeasonsGreetings.deploy(
      image,
      animationURL,
      membershipContract.address
    );
  });

  it.only("should set the correct info", async function () {
    expect(await contract.baseImageURI()).to.equal(image);
    expect(await contract.baseAnimationURI()).to.equal(animationURL);
    expect(await contract.MAX_MEMBER_FREE_SENDS()).to.equal(3);
    expect(await contract.isPostOfficeOpen()).to.equal(true);
  });

  it("should set the correct owner", async () => {
    expect(await contract.owner()).to.equal(owner.address);
  });

  it("should set the token image url", async () => {
    await contract.setBaseImageURI("ipfs://foo");
    expect(await contract.baseImageURI()).to.equal("ipfs://foo");
  });

  it("should set the token animation url", async () => {
    await contract.setBaseAnimationURI("ipfs://foo");
    expect(await contract.baseAnimationURI()).to.equal("ipfs://foo");
  });

  it("should allow you to send a card", async () => {
    const price = contract.PRICE();
    expect(await contract.sendGreeting(addr1.address, { value: price }))
      .to.emit(contract, "Transfer")
      .withArgs(ethers.constants.AddressZero, addr1.address, 1);

    const token = await contract.tokenURI(1);
    const decoded = Buffer.from(token.substring(29), "base64").toString();

    const data = JSON.parse(decoded);
    expect(data.name).to.equal(`${name} #1`);
    expect(data.description).to.equal(desc);

    expect(data.attributes[0].trait_type).to.equal("Seed");
    expect(data.attributes[1].trait_type).to.equal("From");
    expect(data.attributes[1].value).to.equal(owner.address.toLowerCase());
    expect(data.attributes[2].trait_type).to.equal("To");
    expect(data.attributes[2].value).to.equal(addr1.address.toLowerCase());

    const query = data.animation_url.split("?");
    expect(query[0]).to.equal(animationURL);

    const params = query[1].split("&");
    expect(params[1]).to.equal(`f=${owner.address.toLowerCase()}`);
    expect(params[2]).to.equal(`t=${addr1.address.toLowerCase()}`);
  });

  it("should allow free mints if you're a cozy co. member", async () => {
    await membershipContract.issueMembership(owner.address, 1);
    await contract.sendGreetingFromMember(addr2.address);
    await contract.sendGreetingFromMember(addr2.address);
    await contract.sendGreetingFromMember(addr2.address);
    expect(contract.sendGreetingFromMember(addr2.address)).to.be.revertedWith(
      "no more free sends"
    );
  });

  it("should not allow free mints if you're not a cozy co. member", async () => {
    expect(contract.sendGreetingFromMember(addr2.address)).to.be.revertedWith(
      "not a cozy co member"
    );
  });

  it("should update metadata after a transfer", async () => {
    const price = contract.PRICE();
    expect(await contract.sendGreeting(addr1.address, { value: price }))
      .to.emit(contract, "Transfer")
      .withArgs(ethers.constants.AddressZero, addr1.address, 1);

    const token = await contract.tokenURI(1);
    const data = JSON.parse(
      Buffer.from(token.substring(29), "base64").toString()
    );
    expect(data.attributes[1].value).to.equal(owner.address.toLowerCase());
    expect(data.attributes[2].value).to.equal(addr1.address.toLowerCase());

    await contract.connect(addr1).transferFrom(addr1.address, addr2.address, 1);

    const updatedToken = await contract.tokenURI(1);
    const updatedData = JSON.parse(
      Buffer.from(updatedToken.substring(29), "base64").toString()
    );
    expect(updatedData.attributes[1].value).to.equal(
      addr1.address.toLowerCase()
    );
    expect(updatedData.attributes[2].value).to.equal(
      addr2.address.toLowerCase()
    );
  });
});
