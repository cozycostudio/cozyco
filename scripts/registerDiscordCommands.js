require("dotenv").config();
const axios = require("axios");

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

if (!DISCORD_CLIENT_ID || !DISCORD_BOT_TOKEN) {
  throw new Error("Environment variables not configured correctly");
}
const discordClient = axios.create({
  baseURL: "https://discord.com/api/v8",
  headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` },
});

const getGlobalCommands = () =>
  discordClient.get(`/applications/${DISCORD_CLIENT_ID}/commands`);

const createGlobalCommand = (command) =>
  discordClient.post(`/applications/${DISCORD_CLIENT_ID}/commands`, command);

const deleteGlobalCommand = (commandID) =>
  discordClient.delete(
    `/applications/${DISCORD_CLIENT_ID}/commands/${commandID}`
  );

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

  const { data: commands } = await getGlobalCommands();
  console.log(commands);
})().catch((err) => {
  console.error(err);
});
