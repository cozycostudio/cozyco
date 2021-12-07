import { NextApiRequest, NextApiResponse } from "next";
import keccak256 from "keccak256";
import { merkleTree } from "../../../tokens/cozyco-memberships";

export interface MemberListCheckResponse {
  proof: string[];
}

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<MemberListCheckResponse>
) => {
  const address = req.query.address as string;
  const proof = merkleTree.getHexProof(keccak256(address));
  res.json({ proof });
};

export default handler;
