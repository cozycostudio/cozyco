import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";

const animation_url = fs
  .readFileSync("pages/api/seasons-greetings/animation_url.html")
  .toString();

const handler = async (_: NextApiRequest, res: NextApiResponse) => {
  res.send(animation_url);
};

export default handler;
