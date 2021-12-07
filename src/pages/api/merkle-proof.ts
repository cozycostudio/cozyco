import { NextApiRequest, NextApiResponse } from "next";
import keccak256 from "keccak256";
import { merkleTree } from "../../../tokens/cozyco-memberships";

export interface GetMerkleProofResponse {
  proof: string[];
}

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<GetMerkleProofResponse>
) => {
  const address = req.query.address as string;
  const proof = merkleTree.getHexProof(keccak256(address));
  res.json({ proof });
};

export default handler;
