import React, { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { PageContent } from "../components/PageContent";
import { H3, Paragraph } from "../components/Typography";
import { MaxWidthWrapper } from "../components/MaxWidthWrapper";
import { Button } from "../components/Button";
import { Header } from "../components/Header";
import { useWallet } from "@gimmixorg/use-wallet";
import { connectOptions } from "../utils/connectOptions";
import { LoadingText } from "src/components/LoadingText";
import styled from "styled-components";

enum ClaimRolesState {
  NO_DISCORD_AUTH = "NO_DISCORD_AUTH",
  NOT_CONNECTED = "NOT_CONNECTED",
  WRONG_NETWORK = "WRONG_NETWORK",
  READY = "READY",
  CLAIMING_ROLES = "CLAIMING_ROLES",
  CLAIMED_ROLES = "CLAIMED_ROLES",
  ERROR = "ERROR",
}

interface RoleMap {
  [roleId: string]: {
    label: string;
    color: string;
  };
}

const roleMap: RoleMap = {
  "942837779761614890": {
    label: "friend of cozy co",
    color: "#cfc3b2",
  },
  "943068242799378432": {
    label: "snuggler",
    color: "#9679fc",
  },
  "901649257038237758": {
    label: "quilt collector",
    color: "#5d98f1",
  },
  "900207882828668988": {
    label: "pretty cozy",
    color: "#95d17a",
  },
};

const Roles = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
`;

const Role = styled(Paragraph)<{ $roleColor?: string }>`
  display: inline-flex;
  align-items: center;
  background: white;
  border-radius: 4px;
  padding: 12px;
  &:before {
    content: "";
    display: block;
    width: 8px;
    height: 8px;
    border-radius: 4px;
    margin-right: 8px;
    background: ${(p) => p.$roleColor || p.theme.colors.accent};
  }
`;

export default function DiscordRoles() {
  const { data: session } = useSession();
  const { account, provider, connect, network } = useWallet();
  const [claimRolesState, setClaimRolesState] = useState<ClaimRolesState>(
    ClaimRolesState.NO_DISCORD_AUTH
  );
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    if (!session) {
      setClaimRolesState(ClaimRolesState.NO_DISCORD_AUTH);
      return;
    }
    if (session && !account) {
      setClaimRolesState(ClaimRolesState.NOT_CONNECTED);
      return;
    }
    if (session && account) {
      if (network?.chainId !== 1) {
        setClaimRolesState(ClaimRolesState.WRONG_NETWORK);
        return;
      }
      setClaimRolesState(ClaimRolesState.READY);
      return;
    }
  }, [session, account, network]);

  const assignRoles = async () => {
    const sig = await provider
      ?.getSigner()
      .signMessage("Claim cozy co discord roles")
      .catch((error) => {
        console.error(error.message);
        setClaimRolesState(ClaimRolesState.ERROR);
      });

    if (!sig) {
      setClaimRolesState(ClaimRolesState.ERROR);
    }

    return fetch("/api/set-roles", {
      body: JSON.stringify({
        sig,
      }),
      method: "POST",
    }).then((res) => res.json());
  };

  const claimRoles = async () => {
    setClaimRolesState(ClaimRolesState.CLAIMING_ROLES);
    const { roles: newRoles } = await assignRoles();
    setRoles(newRoles);
    setClaimRolesState(ClaimRolesState.CLAIMED_ROLES);
  };

  return (
    <PageContent>
      <Header />
      <MaxWidthWrapper as="section">
        <H3 margin="0 0 xs">claim discord roles</H3>
        {claimRolesState === ClaimRolesState.NO_DISCORD_AUTH && (
          <>
            <Paragraph>
              log in with discord, connect your wallet, and your cozy co discord
              roles will be assigned. you'll be given certain roles based on the
              cozy co NFTs you own like quilts or our membership card.
            </Paragraph>
            <Button margin="m 0 0" onClick={() => signIn("discord")}>
              log in with discord
            </Button>
          </>
        )}

        {claimRolesState === ClaimRolesState.NOT_CONNECTED && (
          <>
            <Paragraph>
              your discord is connected, now you need to connect your wallet.
              make sure to connect to the wallet that has your cozy co NFTs in
              it!
            </Paragraph>
            <Button margin="m 0 0" onClick={() => connect(connectOptions)}>
              connect wallet
            </Button>
          </>
        )}

        {claimRolesState === ClaimRolesState.READY && (
          <>
            <Paragraph>
              now you just need to confirm we can check your wallet balances.
              this is just like logging in to OpenSea.
            </Paragraph>
            <Button margin="m 0 0" onClick={() => claimRoles()}>
              sign message
            </Button>
          </>
        )}

        {claimRolesState === ClaimRolesState.CLAIMING_ROLES && (
          <Paragraph>
            <LoadingText>working on it</LoadingText>
          </Paragraph>
        )}

        {claimRolesState === ClaimRolesState.ERROR && (
          <Paragraph>
            whoops, something went wrong… reload the page and try again
          </Paragraph>
        )}

        {claimRolesState === ClaimRolesState.CLAIMED_ROLES && (
          <>
            {roles.length > 0 ? (
              <>
                <Paragraph margin="0 0 s">
                  you now have the following roles in discord! drop by and say
                  hi to give them a spin
                </Paragraph>
                <Roles>
                  {roles.map((role) => (
                    <Role $roleColor={roleMap[role].color}>
                      {roleMap[role].label}
                    </Role>
                  ))}
                </Roles>
              </>
            ) : (
              <Paragraph>
                it looks like there are no roles for you to claim in Discord
                right now. this is likely because the wallet you connected with
                had no cozy co NFTs in it.
              </Paragraph>
            )}
          </>
        )}
      </MaxWidthWrapper>
    </PageContent>
  );
}
