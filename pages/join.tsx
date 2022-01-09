import React, { useCallback, useEffect, useState } from "react";
import Head from "next/head";
import useSWR from "swr";
import { BigNumber } from "ethers";
import { useWeb3 } from "../hooks/useWeb3";
import { useModal } from "../hooks/useModal";
import { useMint } from "../hooks/useMint";
import { ModalType } from "../providers/ModalManager";
import { GetMerkleProofResponse } from "./api/cozyco-memberships/merkle-proof";
import { MemberListCheckResponse } from "./api/cozyco-memberships/check-list";
import { fetcher } from "../utils/fetch";
import { Paragraph } from "../components/Typography";
import { PageContent } from "../components/PageContent";
import { MaxWidthWrapper } from "../components/MaxWidthWrapper";
import { Header } from "../components/Header";
import { Button } from "../components/Button";
import { LoadingText } from "../components/LoadingText";

enum MintingState {
  NOT_READY = "NOT_READY",
  NOT_CONNECTED = "NOT_CONNECTED",
  ALREADY_CLAIMED = "ALREADY_CLAIMED",
  READY = "READY",
  WAITING = "WAITING",
  ERROR = "ERROR",
  BROADCASTED = "BROADCASTED",
  CONFIRMED = "CONFIRMED",
}

// TODO: Allow for different token types at some point
enum MembershipType {
  FRIEND_OF = 1,
}

function JoinCozyCo() {
  const { account } = useWeb3();
  const { openModal } = useModal();
  const { writeableContract } = useMint();
  const [mintingState, setMintingState] = useState<MintingState>(
    MintingState.NOT_READY
  );
  // TODO: Allow for balances of different token types at some point
  const [balance, setBalance] = useState(0);

  const { data: memberList } = useSWR<GetMerkleProofResponse>(
    account ? `/api/merkle-proof?address=${account}` : null,
    fetcher
  );

  const { data: checkList } = useSWR<MemberListCheckResponse>(
    account ? `/api/check-list?address=${account}` : null,
    fetcher
  );

  // Set state of minting
  useEffect(() => {
    // Check if there's an account connected and set NOT_CONNECTED
    if (!account) {
      setMintingState(MintingState.NOT_CONNECTED);
      return;
    }
    // Check if there's a writeable contract for minting and set READY
    if (writeableContract) {
      setMintingState(MintingState.NOT_READY);
      writeableContract
        .balanceOf(account, MembershipType.FRIEND_OF)
        .then((balanceOfFriendsToken: BigNumber) => {
          setBalance(balanceOfFriendsToken.toNumber());
          if (balanceOfFriendsToken.toNumber() > 0) {
            setMintingState(MintingState.ALREADY_CLAIMED);
          } else {
            setMintingState(MintingState.READY);
          }
        })
        .catch((e: any) => {
          console.error(e);
        });
    }
  }, [account, writeableContract]);

  // When the mint button is pressed
  const handleMint = useCallback(async () => {
    if (!account) {
      setMintingState(MintingState.NOT_CONNECTED);
      openModal(ModalType.WEB3_CONNECT);
      return;
    }
    if (!writeableContract || !memberList) {
      setMintingState(MintingState.NOT_READY);
      return;
    }
    if (mintingState === MintingState.ERROR) {
      setMintingState(MintingState.READY);
    }
    if (
      ![MintingState.READY, MintingState.ERROR].includes(mintingState as any)
    ) {
      return;
    }

    try {
      setMintingState(MintingState.WAITING);
      const tx = await writeableContract.joinCozyCo(
        memberList.proof,
        MembershipType.FRIEND_OF
      );
      setMintingState(MintingState.BROADCASTED);
      await tx.wait();
      setMintingState(MintingState.CONFIRMED);
    } catch (e: any) {
      console.error(e);
      setMintingState(MintingState.ERROR);
    }
  }, [mintingState, memberList]);

  const metaTitle = "join cozy co.";
  const metaDescription =
    "a very limited number of special membership cards are available, join the club!";
  const metaImage = "https://cozyco.studio/og-image-join-active.png";

  return (
    <PageContent>
      <Head>
        <title>{metaTitle}</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content={metaImage} />
        <meta property="og:url" content="https://cozyco.studio/join" />
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:description" content={metaDescription} />
        <meta name="twitter:image" content={metaImage} />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <Header subPageTitle="friend of cozy co." />
      <MaxWidthWrapper as="section">
        {mintingState === MintingState.NOT_CONNECTED && (
          <>
            <Paragraph margin="0 0 m">
              Connect your wallet to see if you're eligible to mint a cozy
              membership card.
            </Paragraph>
            <Button onClick={handleMint}>connect wallet</Button>
          </>
        )}

        {mintingState === MintingState.NOT_READY && (
          <Paragraph>
            <LoadingText>Loading some things, 2 secs</LoadingText>
          </Paragraph>
        )}

        {mintingState === MintingState.ALREADY_CLAIMED && (
          <>
            <Paragraph>You're already a member!</Paragraph>
            <Paragraph margin="s 0 0">
              Don't forget to check out the <a href="/s/twitter">Twitter</a> and{" "}
              <a href="/s/discord">Discord</a> to know when the first cozy co.
              drop happens.
            </Paragraph>
          </>
        )}

        {mintingState === MintingState.READY && !checkList && (
          <Paragraph>
            <LoadingText>Checking the list</LoadingText>
          </Paragraph>
        )}

        {mintingState === MintingState.READY &&
          checkList &&
          !checkList.isOnList && (
            <>
              <Paragraph>
                Sadly you're not on the list right now. Tweet{" "}
                <a href="/s/twitter">@cozycostudio</a> or hop in the{" "}
                <a href="/s/discord">Discord</a> and your luck may change!
              </Paragraph>
              <Paragraph margin="s 0 0">
                Note: The initial round of memberships were only for people who
                filled out a form, and had a quilt at the time of a snapshot.
                These requirements may change in future and be open to everyone.
              </Paragraph>
            </>
          )}

        {checkList && checkList.isOnList && balance === 0 && (
          <>
            {mintingState === MintingState.READY && (
              <>
                <Paragraph margin="0 0 m">
                  You're on the list! Claim your membership card below. It's
                  free, you'll just pay for gas.
                </Paragraph>
                <Button onClick={handleMint}>claim membership card</Button>
              </>
            )}

            {mintingState === MintingState.ERROR && (
              <>
                <Paragraph margin="0 0 m">
                  You're on the list! Claim your membership card below. It's
                  free, you'll just pay for gas.
                </Paragraph>
                <Button onClick={handleMint}>claim membership card</Button>
                <Paragraph margin="s 0 0">
                  <small>
                    Something went wrong. You can try again but if it persists,
                    reach out on Twitter or Discord.
                  </small>
                </Paragraph>
              </>
            )}

            {mintingState === MintingState.WAITING && (
              <>
                <Paragraph margin="0 0 m">
                  You're on the list! Claim your membership card below. It's
                  free, you'll just pay for gas.
                </Paragraph>
                <Button onClick={() => {}}>
                  <LoadingText>claiming</LoadingText>
                </Button>
              </>
            )}

            {mintingState === MintingState.BROADCASTED && (
              <>
                <Paragraph>
                  Nice! Now we wait for Ethereum to do it's thing. Your
                  membership card should be with you soon. Feel free to close
                  this page and check your wallet later.
                </Paragraph>
                <Paragraph margin="s 0 0">
                  Don't forget to check out the <a href="/s/twitter">Twitter</a>{" "}
                  and <a href="/s/discord">Discord</a> to know when the first
                  cozy co. drop happens.
                </Paragraph>
              </>
            )}

            {mintingState === MintingState.CONFIRMED && (
              <>
                <Paragraph>
                  Welcome to cozy co. You're now an official member!
                </Paragraph>
                <Paragraph margin="s 0 0">
                  Don't forget to check out the <a href="/s/twitter">Twitter</a>{" "}
                  and <a href="/s/discord">Discord</a> to know when the first
                  cozy co. drop happens.
                </Paragraph>
              </>
            )}
          </>
        )}
      </MaxWidthWrapper>
    </PageContent>
  );
}

export default JoinCozyCo;
