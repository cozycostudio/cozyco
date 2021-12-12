import { NextApiRequest, NextApiResponse } from "next";
import { makeCoverArt } from "tokens/cozyco-seasons-greetings/cover-art";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const seed = req.query.s as string;
  // const from = req.query.f as string;
  // const to = req.query.t as string;

  const svg = makeCoverArt(seed);

  res.setHeader("Content-Type", "image/svg+xml");
  res.send(svg);
};

export default handler;
