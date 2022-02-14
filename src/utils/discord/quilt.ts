import {
  APIEmbed,
  APIEmbedField,
  APIInteractionResponseCallbackData,
} from "discord-api-types/v8";
import quiltTokens from "../../../tokens/quilts/tokens.json";
import { contractAddress } from "../deployedContracts";

const finestQuiltsChannelId = "897418619582029845";

export interface Quilt {
  tokenId: number;
  name: string;
  attributes: {
    background: string;
    animatedBackground: boolean;
    theme: string;
    backgroundTheme: string;
    patches: string[];
    specialPatch: boolean;
    patchCount: number;
    aspectRatio: string;
    calmness: string;
    hovers: boolean;
    roundness: number;
  };
  image: {
    ipfsSVG: string;
    ipfsPNG: string;
    ipfsGIF: string | null;
  };
}

const tokensById = quiltTokens as Record<string, Quilt>;

export function getQuilt(
  tokenId: string,
  channelId: string
): APIInteractionResponseCallbackData {
  if (channelId !== finestQuiltsChannelId) {
    return {
      content: `Whoops, try that command in <#${finestQuiltsChannelId}> fren`,
      flags: 1 << 6,
    };
  }

  if (parseInt(tokenId, 10) < 1 || parseInt(tokenId, 10) > 4000) {
    return {
      content:
        "Oh no, that doesn't look like a valid quilt number! Try between 1-4000.",
      flags: 1 << 6,
    };
  }

  const token = tokensById[tokenId];
  if (!token) {
    return {
      content: "Couldn't find that quilt for some reason. Try again maybe?",
      flags: 1 << 6,
    };
  }

  const isAnimated = Boolean(
    token.attributes.animatedBackground || token.attributes.hovers
  );

  const patchCounts: Record<string, number> = {};
  for (const patch of token.attributes.patches) {
    patchCounts[patch] = patchCounts[patch] ? patchCounts[patch] + 1 : 1;
  }

  const patchesStr = Object.entries(patchCounts)
    .reduce((strArr: string[], [patchName, count]) => {
      return [...strArr, `${patchName}${count > 1 ? ` (x${count})` : ""}`];
    }, [])
    .join(", ");

  const imageUrl = `https://gateway.pinata.cloud/ipfs/${
    isAnimated ? token.image.ipfsGIF : token.image.ipfsPNG
  }`;

  const fields: APIEmbedField[] = [
    { name: "Theme", value: token.attributes.theme, inline: true },
    {
      name: "BG Theme",
      value: token.attributes.backgroundTheme,
      inline: true,
    },
    { name: "Background", value: token.attributes.background, inline: true },
    {
      name: "Calmness",
      value: token.attributes.calmness,
      inline: true,
    },
    {
      name: "Hovers",
      value: token.attributes.hovers ? "Yes" : "No",
      inline: true,
    },
    {
      name: "Animated BG",
      value: token.attributes.animatedBackground ? "Yes" : "No",
      inline: true,
    },
    {
      name: "Aspect ratio",
      value: token.attributes.aspectRatio,
      inline: true,
    },
    {
      name: "Kitty patch",
      value: token.attributes.specialPatch ? "Yes!" : "No",
      inline: true,
    },
    {
      name: "Roundness",
      value: `${token.attributes.roundness}`,
      inline: true,
    },
    {
      name:
        token.attributes.patchCount > 1
          ? `${token.attributes.patchCount} Patches`
          : "1 Patch",
      value: patchesStr,
    },
    {
      name: "Image",
      value: `[Download image](${imageUrl})`,
    },
  ];

  const embed: APIEmbed = {
    title: token.name,
    url: `https://opensea.io/assets/${contractAddress(
      "cozyCoMembership",
      1
    )}/${tokenId}`,
    fields,
    image: {
      url: imageUrl,
    },
  };

  return { embeds: [embed] };
}
