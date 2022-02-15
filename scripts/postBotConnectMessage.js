require("dotenv").config();
const axios = require("axios");

const channelId = "942817916993277993";

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

if (!DISCORD_CLIENT_ID || !DISCORD_BOT_TOKEN) {
  throw new Error("Environment variables not configured correctly");
}

const discordClient = axios.create({
  baseURL: "https://discord.com/api/v8",
  headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` },
});

const CONNECT_URL = "https://cozyco.studio/discord-roles";

(async () => {
  await discordClient.post(`/channels/${channelId}/messages`, {
    content:
      "Do you have a cozy co NFT? Connect your wallet to Discord below. You'll get certain roles based on the NFTs you own like quilts or our membership card",
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
  });
})().catch((err) => {
  console.error(err);
});
