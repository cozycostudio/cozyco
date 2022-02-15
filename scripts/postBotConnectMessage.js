require("dotenv").config();
require("isomorphic-fetch");

const channelId = "943081136672866324";

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

if (!DISCORD_CLIENT_ID || !DISCORD_BOT_TOKEN) {
  throw new Error("Environment variables not configured correctly");
}

const CONNECT_URL = "https://cozyco.studio/discord-roles";

(async () => {
  await fetch(`https://discord.com/api/v8/channels/${channelId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content:
        "Wow. Do you have a cozy co NFT? Connect your wallet to Discord below. You'll get certain roles based on the NFTs you own like quilts or our membership card. If you're having trouble connecting, please DM <@242049503924977665>.",
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              label: "Connect wallet to Discord",
              style: 5,
              url: CONNECT_URL,
            },
          ],
        },
      ],
    }),
  });
})().catch((err) => {
  console.error(err);
});
