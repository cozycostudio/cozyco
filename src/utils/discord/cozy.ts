export function getRandomRange(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
}

const patchEmojis = [
  "<:quilty:899117131965288448>",
  "<:flow:899118177076793365>",
  "<:sunbeam:899118176955138108>",
  "<:spires:899118177143898112>",
  "<:division:899118177005502464>",
  "<:crashingwaves:899118176892256276>",
  "<:equilibrium:899118177009668156>",
  "<:ichimatsu:899118177160679435>",
  "<:highlands:899118177051631656>",
  "<:logcabin:899118177051623464>",
  "<:maiz:899118177487831050>",
  "<:flyinggeese:899118177026465853>",
  "<:pinwheel:899118176875458561>",
  "<:bengal:900363530103062579>",
  "<:waterfront:900363530132418590>",
  "<:kawaii:901532657425481748>",
];

export function getCozyQuilt() {
  const width = getRandomRange(2, 5);
  const height = getRandomRange(2, 5);
  const includesSpecialPatch = Math.random() < 0.1;
  const spX = getRandomRange(0, width);
  const spY = getRandomRange(0, height);

  const patches: string[][] = [];

  for (let row = 0; row < height; row++) {
    patches[row] = [];
    for (let col = 0; col < width; col++) {
      patches[row][col] = patchEmojis[getRandomRange(0, 15)];
    }
  }

  if (includesSpecialPatch) {
    patches[spY][spX] = patchEmojis[15];
  }

  return `\n${patches.map((cols) => cols.join("")).join("\n")}`;
}
