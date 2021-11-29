import { NextApiRequest, NextApiResponse } from "next";
import membershipList from "../../data/membership-list.json";
import { isValidAddress, resolveAddress } from "../../utils/eth";

export interface MemberListCheckResponse {
  isOnList: boolean;
}

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<MemberListCheckResponse>
) => {
  const address = req.query.address as string;
  if (!isValidAddress(address)) {
    throw new Error("Invalid wallet address");
  }
  const resolvedAddress = await resolveAddress(address);
  const isOnList = resolvedAddress
    ? membershipList.includes(resolvedAddress.toLowerCase())
    : false;

  res.json({ isOnList });
};

export default handler;
