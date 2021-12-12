import { makeCoverArt } from "./cover-art";

export function makeGreetingsCard(seed: string, from: string, to: string) {
  const cover = makeCoverArt(seed);

  return `
    <html>
      <body>
        <div class="cover">
          ${cover}
        </div>
        <div class="inside">
          <p>Dear<br />${to || "..."}</p>
          <p>Season's greetings, and a happy new year!</p>
          <p>From<br />${from || "..."}</p>
        </div>
      </body>
    </html>
  `;
}
