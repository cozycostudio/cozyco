require("dotenv").config();
require("isomorphic-fetch");

const channelId = "928810316811341904";

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

if (!DISCORD_CLIENT_ID || !DISCORD_BOT_TOKEN) {
  throw new Error("Environment variables not configured correctly");
}

(async () => {
  await fetch(`https://discord.com/api/v8/channels/${channelId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content:
        "Welcome! It's a pleasure to have you here. Before you start, you'll need to use the button below to gain access to all the channels. This just helps us reduce spam. See you soon! <a:cozypet:903460062390001694>",
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              label: "Let me in",
              style: 3,
              custom_id: "let_me_in",
            },
          ],
        },
      ],
    }),
  });
})().catch((err) => {
  console.error(err);
});
