import { Contract } from "ethers";
import { ethers } from "hardhat";

export async function deployCozyCoMembership() {
  const CozyCoMembership = await ethers.getContractFactory("CozyCoMembership");
  const contract = await CozyCoMembership.deploy();
  return contract;
}

export async function deployMembershipMetadata() {
  const CCMFriendsOfMetadata = await ethers.getContractFactory(
    "CCMFriendsOfMetadata"
  );
  const contract = await CCMFriendsOfMetadata.deploy("", "", "");
  return contract;
}

export async function deployCozyCoQuiltSupplyStore(
  membershipAddress: Contract["address"],
  quiltMakerAddress: Contract["address"]
) {
  const CozyCoQuiltSupplyStore = await ethers.getContractFactory(
    "CozyCoQuiltSupplyStore"
  );
  const contract = await CozyCoQuiltSupplyStore.deploy(
    membershipAddress,
    quiltMakerAddress
  );
  return contract;
}

export async function deployQuiltMakerRenderer() {
  const QuiltMakerRenderer = await ethers.getContractFactory(
    "QuiltMakerRenderer"
  );
  const contract = await QuiltMakerRenderer.deploy();
  return contract;
}
export async function deployQuiltMaker(
  quiltMakerRendererAddress: Contract["address"],
  cozyCoMembershipAddress: Contract["address"]
) {
  const QuiltMaker = await ethers.getContractFactory("QuiltMaker");
  const contract = await QuiltMaker.deploy(
    quiltMakerRendererAddress,
    cozyCoMembershipAddress
  );
  return contract;
}

export async function deployBlankPatches() {
  const PatchesBlankData = await ethers.getContractFactory("PatchesBlankData");
  const contract = await PatchesBlankData.deploy();
  return contract;
}
