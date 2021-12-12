import { NextApiRequest, NextApiResponse } from "next";
import { makeCoverArt } from "tokens/cozyco-seasons-greetings/cover-art";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const seed = req.query.s as string;
  const svg = makeCoverArt(seed);
  res.send(svg);
};

export default handler;
