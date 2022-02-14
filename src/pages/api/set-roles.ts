import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import fetch from "isomorphic-fetch";
import { Contract, providers, utils } from "ethers";
import { contractAbi, contractAddress } from "../../utils/deployedContracts";

const guildId = "897406825618604033";

const rpc = new providers.JsonRpcProvider(
  `https://mainnet.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_ID}`
);

const quiltsContract = new Contract(
  contractAddress("quilts", 1),
  contractAbi("quilts"),
  rpc
);

const membershipContract = new Contract(
  contractAddress("cozyCoMembership", 1),
  contractAbi("cozyCoMembership"),
  rpc
);

const roleMap = {
  // "quilt stitcher": "897406897324437545",
  // "store manager": "902404059020025857",
  // "pretty cozy": "900207882828668988",
  "friend of cozy co": "942837779761614890",
  "quilt collector": "901649257038237758",
};

type RoleName = keyof typeof roleMap;

interface SetRolesResponse {
  roles: string[];
}

export default async (
  req: NextApiRequest,
  res: NextApiResponse<SetRolesResponse>
) => {
  const session = await getSession({ req });

  if (!session) return;

  const { sig } = JSON.parse(req.body);
  const address = utils.verifyMessage("Claim cozy co discord roles", sig);
  if (!sig || !address) {
    return res.send({ roles: [] });
  }

  const numOfQuilts = await quiltsContract.balanceOf(address);
  const numOfFriendsMembership = await membershipContract.balanceOf(address, 1);

  const newRoles: string[] = [];
  if (numOfQuilts > 0) {
    newRoles.push(roleMap["quilt collector"]);
  }

  if (numOfFriendsMembership > 0) {
    newRoles.push(roleMap["friend of cozy co"]);
  }

  const existingRoles = await fetch(
    `https://discord.com/api/guilds/${guildId}/members/${session.userId}`,
    {
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
      },
    }
  )
    .then((response) => response.json())
    .then((data) => data.roles);

  const addRoles = newRoles.filter((roleId) => !existingRoles.includes(roleId));

  const removeRoles: string[] = [];
  Object.keys(roleMap).map((roleKey) => {
    const key = roleKey as RoleName;
    const roleId = roleMap[key];
    if (existingRoles.includes(roleId) && !newRoles.includes(roleId)) {
      removeRoles.push(roleId);
    }
  });

  for (const roleId of addRoles) {
    await fetch(
      `https://discord.com/api/guilds/${guildId}/members/${session.userId}/roles/${roleId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
        },
      }
    );
  }

  for (const roleId of removeRoles) {
    await fetch(
      `https://discord.com/api/guilds/${guildId}/members/${session.userId}/roles/${roleId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
        },
      }
    );
  }

  res.send({ roles: newRoles });
};
