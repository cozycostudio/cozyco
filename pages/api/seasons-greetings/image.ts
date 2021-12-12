import { NextApiRequest, NextApiResponse } from "next";
import { makeCoverArt } from "tokens/cozyco-seasons-greetings/cover-art";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const seed = req.query.s as string;
  const svg = makeCoverArt(seed);
  res.statusCode = 200;
  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader(
    "Cache-Control",
    "public, immutable, no-transform, s-maxage=31536000, max-age=31536000"
  );
  res.end(svg);
};

export default handler;
