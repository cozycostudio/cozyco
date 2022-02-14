import { APIInteractionResponseCallbackData } from "discord-api-types/v8";

const Airtable = require("airtable");

Airtable.configure({
  endpointUrl: "https://api.airtable.com",
  apiKey: process.env.AIRTABLE_API_KEY,
});

const base = Airtable.base("appuhMYgdHytek3wN");

interface Vibe {
  id: string;
  link: string;
  submittedBy?: string;
}

export async function getVibes() {
  const vibes: Vibe[] = [];
  await base("Vibes")
    .select({ view: "Vibes list" })
    .eachPage((records: any, fetchNextPage: any) => {
      records.forEach((record: any) => {
        const id = record.get("ID") as string;
        const link = record.get("link") as string;
        const submittedBy = record.get("submittedBy") as string;
        vibes.push({ id, link, submittedBy });
      });
      fetchNextPage();
    });

  return vibes;
}

const vibePhrases = [
  "Check out this vibe…",
  "We like to vibe…",
  "What's this, a vibe?",
  "Time to get cozy…",
  "Snuggle up…",
];

export async function getRandomVibe(): Promise<APIInteractionResponseCallbackData> {
  const vibes = await getVibes();
  const vibe = vibes[Math.floor(Math.random() * vibes.length)];
  const lines = [];
  lines.push(vibePhrases[Math.floor(Math.random() * vibePhrases.length)]);
  lines.push(vibe.link);
  if (vibe.submittedBy) {
    lines.push(`Submitted by <@${vibe.submittedBy}>`);
  }

  return {
    content: lines.join("\n"),
  };
}

interface CreateVibeFields {
  link: string;
  submittedBy?: string;
}

export async function createVibe({ link, submittedBy }: CreateVibeFields) {
  const fields: CreateVibeFields = {
    link,
  };
  if (submittedBy) {
    fields.submittedBy = submittedBy;
  }
  await base("Vibes").create([{ fields }]);
}
