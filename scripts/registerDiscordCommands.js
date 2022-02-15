require("dotenv").config();
require("isomorphic-fetch");

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

if (!DISCORD_CLIENT_ID || !DISCORD_BOT_TOKEN) {
  throw new Error("Environment variables not configured correctly");
}

const getGlobalCommands = () =>
  fetch(
    `https://discord.com/api/v8/applications/${DISCORD_CLIENT_ID}/commands`,
    {
      headers: {
        Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  ).then((res) => res.json());

const createGlobalCommand = (command) =>
  fetch(
    `https://discord.com/api/v8/applications/${DISCORD_CLIENT_ID}/commands`,
    {
      method: "POST",
      headers: {
        Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(command),
    }
  ).then((res) => res.json());

const deleteGlobalCommand = (commandId) =>
  fetch(
    `https://discord.com/api/v8/applications/${DISCORD_CLIENT_ID}/commands/${commandId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  ).then((res) => res.json());

(async () => {
  // await createGlobalCommand({
  //   name: "pet",
  //   description: "Pet the cozy Quilty",
  // });

  // await createGlobalCommand({
  //   name: "cozy",
  //   description: "Get cozy under a quilt",
  // });

  // await createGlobalCommand({
  //   name: "vibe",
  //   description: "Send a random vibe to the channel",
  // });

  // await createGlobalCommand({
  //   name: "vibe-add",
  //   description: "Add a vibe to the list for the Qrew",
  //   options: [
  //     {
  //       name: "link",
  //       description: "Give us the link",
  //       type: 3,
  //       required: true,
  //     },
  //   ],
  // });

  const commands = await getGlobalCommands();
  console.log(commands);
})().catch((err) => {
  console.error(err);
});
