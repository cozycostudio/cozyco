import { NextApiRequest, NextApiResponse } from "next";
import { merkleTree } from "../../../../tokens/cozyco-memberships";

const handler = async (_: NextApiRequest, res: NextApiResponse) => {
  res.json({ root: merkleTree.getHexRoot() });
};

export default handler;
