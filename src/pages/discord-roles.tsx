import React, { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { PageContent } from "../components/PageContent";
import { Paragraph } from "../components/Typography";
import { MaxWidthWrapper } from "../components/MaxWidthWrapper";
import { Button } from "../components/Button";
import { Header } from "../components/Header";
import { useWallet } from "@gimmixorg/use-wallet";
import { connectOptions } from "../utils/connectOptions";
import { LoadingText } from "src/components/LoadingText";

enum ClaimRolesState {
  NO_DISCORD_AUTH = "NO_DISCORD_AUTH",
  NOT_CONNECTED = "NOT_CONNECTED",
  WRONG_NETWORK = "WRONG_NETWORK",
  READY = "READY",
  CLAIMING_ROLES = "CLAIMING_ROLES",
  CLAIMED_ROLES = "CLAIMED_ROLES",
  ERROR = "ERROR",
}

function Index() {
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

  console.log(roles);
  console.log(claimRolesState);

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
        {claimRolesState === ClaimRolesState.NO_DISCORD_AUTH && (
          <>
            <Paragraph>Claim your discord roles :)</Paragraph>
            <Button margin="m 0 0" onClick={() => signIn("discord")}>
              Authenticate with Discord
            </Button>
          </>
        )}

        {claimRolesState === ClaimRolesState.NOT_CONNECTED && (
          <>
            <Paragraph>Connect your wallet</Paragraph>
            <Button margin="m 0 0" onClick={() => connect(connectOptions)}>
              Connect wallet
            </Button>
          </>
        )}

        {claimRolesState === ClaimRolesState.READY && (
          <>
            <Paragraph>Sign a message to get your roles</Paragraph>
            <Button margin="m 0 0" onClick={() => claimRoles()}>
              Sign message
            </Button>
          </>
        )}

        {claimRolesState === ClaimRolesState.CLAIMING_ROLES && (
          <Paragraph>
            <LoadingText>Claiming your roles</LoadingText>
          </Paragraph>
        )}

        {claimRolesState === ClaimRolesState.CLAIMED_ROLES && (
          <>
            <Paragraph>Claimed the following roles</Paragraph>
            {roles.map((role) => (
              <Paragraph>{role}</Paragraph>
            ))}
          </>
        )}
      </MaxWidthWrapper>
    </PageContent>
  );
}

export default Index;
