import { NextApiRequest, NextApiResponse } from "next";
import animation_url from "./animation_url.html";

const handler = async (_: NextApiRequest, res: NextApiResponse) => {
  res.send(animation_url);
};

export default handler;
