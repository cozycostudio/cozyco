import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import {
  APIApplicationCommandInteraction,
  APIInteractionResponse,
} from "discord-api-types/v8";
import nacl from "tweetnacl";
import fetch from "isomorphic-fetch";
import { getQuilt } from "../../utils/discord/quilt";
import { getCozyQuilt } from "../../utils/discord/cozy";
import { createVibe, getRandomVibe } from "../../utils/discord/vibe";

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_CLIENT_PUBLIC_KEY = process.env.DISCORD_CLIENT_PUBLIC_KEY;

if (!DISCORD_CLIENT_ID || !DISCORD_BOT_TOKEN || !DISCORD_CLIENT_PUBLIC_KEY) {
  throw new Error("Environment variables not configured correctly");
}

// disable body parsing, we need the raw body for discord interactions
export const config = {
  api: {
    bodyParser: false,
  },
};

const handler = async (
  _: NextApiRequest,
  res: NextApiResponse<APIInteractionResponse>,
  interaction: APIApplicationCommandInteraction
) => {
  const name = interaction.data.name;
  // @ts-ignore
  const options = interaction.data.options;
  const channelId = interaction.channel_id;
  const userId = interaction.user && interaction.user.id;

  const VERIFIED_ROLE_ID = "900207882828668988";

  // @ts-ignore
  if (interaction.data.custom_id === "let_me_in") {
    const guildId = interaction.guild_id;
    const memberId = interaction.member?.user.id;
    await fetch(
      `https://discord.com/api/v8/guilds/${guildId}/members/${memberId}/roles/${VERIFIED_ROLE_ID}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    ).catch(() => {
      return res.status(200).json({
        type: 4,
        data: {
          content: "Oops! Something went wrong. Please try again.",
          flags: 1 << 6,
        },
      });
    });
    return res.status(200).json({
      type: 4,
      data: {
        content: "You're in! <a:cozypet:903460062390001694>",
        flags: 1 << 6,
      },
    });
  }

  switch (name) {
    case "pet":
      return res.status(200).json({
        type: 4,
        data: { content: "<a:cozypet:903460062390001694>" },
      });
    case "quilt":
      const tokenId = options[0].value;
      return res.status(200).json({
        type: 4,
        data: getQuilt(tokenId, channelId),
      });
    case "cozy":
      return res.status(200).json({
        type: 4,
        data: { content: getCozyQuilt() },
      });
    case "vibe-add":
      const link = options[0].value;
      const isValidLink = link.startsWith("http");
      if (!isValidLink) {
        return res.status(200).json({
          type: 4,
          data: {
            content: `Sorry${
              userId ? ` <@${userId}>` : ""
            }, that doesn't look like a valid vibe link. Any URL that starts with \`http\` will do.`,
            flags: 1 << 6,
          },
        });
      }
      await createVibe({
        link,
        submittedBy: userId,
      });
      return res.status(200).json({
        type: 4,
        data: {
          content: `New vibe alert! ${
            userId ? `<@${userId}> just added: ` : ""
          }${link}`,
        },
      });
    case "vibe":
      return res.status(200).json({
        type: 4,
        data: await getRandomVibe(),
      });
    default:
      return res.status(200).json({
        type: 4,
        data: {
          content: "Oops! I don't recognize this command.",
          flags: 1 << 6,
        },
      });
  }
};

type VerifyHeadersArgs = {
  timestamp: string;
  rawBody: string;
  signature: string;
};

const verifyHeaders = ({
  timestamp,
  rawBody,
  signature,
}: VerifyHeadersArgs) => {
  return nacl.sign.detached.verify(
    Buffer.from(timestamp + rawBody),
    Buffer.from(signature, "hex"),
    Buffer.from(DISCORD_CLIENT_PUBLIC_KEY, "hex")
  );
};

const parseRawBodyAsString = (req: NextApiRequest) =>
  new Promise<string>((resolve) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => {
      resolve(Buffer.from(data).toString());
    });
  });

type DiscordInteractionApiHandler = (
  req: NextApiRequest,
  res: NextApiResponse<APIInteractionResponse>,
  interaction: APIApplicationCommandInteraction
) => void | Promise<void>;

const withDiscordInteraction =
  (next: DiscordInteractionApiHandler) =>
  async (req: NextApiRequest, res: NextApiResponse) => {
    const signature = req.headers["x-signature-ed25519"];
    const timestamp = req.headers["x-signature-timestamp"];
    if (typeof signature !== "string" || typeof timestamp !== "string") {
      return res.status(401).end("invalid request signature");
    }

    try {
      const rawBody = await parseRawBodyAsString(req);
      const isVerified = verifyHeaders({ timestamp, rawBody, signature });
      if (!isVerified) {
        return res.status(401).end("invalid request signature");
      }

      const interaction = JSON.parse(rawBody);
      const { type } = interaction;

      if (type === 1) {
        // PING message, respond with ACK
        return res.status(200).json({ type: 1 });
      } else {
        return await next(req, res, interaction);
      }
    } catch (err) {
      return res.status(500).json({
        statusCode: 500,
        message: "Oops, something went wrong parsing the request!",
      });
    }
  };

const withErrorHandler =
  (fn: NextApiHandler) => async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      return await fn(req, res);
    } catch (err: any) {
      const statusCode = err.statusCode || 500;
      const message = err.message || "Oops, something went wrong!";
      res.status(statusCode).json({ statusCode, message });
    }
  };

export default withErrorHandler(withDiscordInteraction(handler));
