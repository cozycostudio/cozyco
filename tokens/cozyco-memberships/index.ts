import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";
import friendsOf from "./cozyco-members-friendsof.json";

export const memberships = {
  friendsOf: {
    name: "friend of cozy co.",
    desc: "a special card for exclusive access to cozy wares and discounts",
    imageURI: "ipfs://QmddGvzRrAvhchqTB2h92UJrR4BXtZWAM2VhDFemwwkxH9",
  },
};

export const membersList = friendsOf;

export const merkleTree = new MerkleTree(friendsOf, keccak256, {
  hashLeaves: true,
  sortPairs: true,
});
