import React, { useCallback, useEffect, useState } from "react";
import Head from "next/head";
import useSWR from "swr";
import { ethers, BigNumber, Contract } from "ethers";
import { useWallet } from "@gimmixorg/use-wallet";
import { GetMerkleProofResponse } from "./api/cozyco-memberships/merkle-proof";
import { MemberListCheckResponse } from "./api/cozyco-memberships/check-list";
import { fetcher } from "../utils/fetch";
import { H3, Paragraph } from "../components/Typography";
import { PageContent } from "../components/PageContent";
import { MaxWidthWrapper } from "../components/MaxWidthWrapper";
import { Header } from "../components/Header";
import { Button } from "../components/Button";
import { LoadingText } from "../components/LoadingText";
import { connectOptions } from "../utils/connectOptions";
import {
  contractAbi,
  contractAddress,
  isChainSupportedForContract,
} from "../utils/deployedContracts";

enum MintingState {
  NOT_READY = "NOT_READY",
  NOT_CONNECTED = "NOT_CONNECTED",
  WRONG_NETWORK = "WRONG_NETWORK",
  ALREADY_CLAIMED = "ALREADY_CLAIMED",
  READY = "READY",
  WAITING = "WAITING",
  ERROR = "ERROR",
  BROADCASTED = "BROADCASTED",
  CONFIRMED = "CONFIRMED",
}

enum MembershipType {
  FRIEND_OF = 1,
}

function JoinCozyCo() {
  const { account, provider, connect, network } = useWallet();
  const [mintingState, setMintingState] = useState<MintingState>(
    MintingState.NOT_READY
  );

  let contract: Contract | undefined;

  if (
    provider &&
    network &&
    isChainSupportedForContract("cozyCoMembership", network.chainId)
  ) {
    contract = new ethers.Contract(
      contractAddress("cozyCoMembership", network.chainId),
      contractAbi("cozyCoMembership"),
      provider
    );
  }

  const [balance, setBalance] = useState(0);

  const { data: merkleProof } = useSWR<GetMerkleProofResponse>(
    account ? `/api/cozyco-memberships/merkle-proof?address=${account}` : null,
    fetcher
  );

  const { data: checkList } = useSWR<MemberListCheckResponse>(
    account ? `/api/cozyco-memberships/check-list?address=${account}` : null,
    fetcher
  );

  // Set state of minting
  useEffect(() => {
    // No account connected
    if (!account) {
      setMintingState(MintingState.NOT_CONNECTED);
      return;
    }

    // Wrong network connected
    if (
      network &&
      !isChainSupportedForContract("cozyCoMembership", network.chainId)
    ) {
      setMintingState(MintingState.WRONG_NETWORK);
      return;
    }

    // Check balances of membership contract
    if (contract) {
      setMintingState(MintingState.NOT_READY);
      contract
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
  }, [account, network]);

  // When the mint button is pressed
  const handleMint = useCallback(async () => {
    if (!account) {
      setMintingState(MintingState.NOT_CONNECTED);
      connect(connectOptions);
      return;
    }
    if (!contract || !merkleProof) {
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
      const tx = await contract.joinCozyCo(
        merkleProof.proof,
        MembershipType.FRIEND_OF
      );
      setMintingState(MintingState.BROADCASTED);
      await tx.wait();
      setMintingState(MintingState.CONFIRMED);
    } catch (e: any) {
      console.error(e);
      setMintingState(MintingState.ERROR);
    }
  }, [mintingState, merkleProof]);

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
      <Header />
      <MaxWidthWrapper as="section">
        <H3>become a friend of cozy co.</H3>
        {mintingState === MintingState.NOT_CONNECTED && (
          <>
            <Paragraph margin="0 0 m">
              connect your wallet to see if you're eligible to join
            </Paragraph>
            <Button onClick={handleMint}>connect wallet</Button>
          </>
        )}

        {mintingState === MintingState.NOT_READY && (
          <Paragraph>
            <LoadingText>loading some things, 2 secs</LoadingText>
          </Paragraph>
        )}

        {mintingState === MintingState.WRONG_NETWORK && (
          <Paragraph>
            connected to the wrong ethereum network. please use mainnet or
            rinkeby.
          </Paragraph>
        )}

        {mintingState === MintingState.ALREADY_CLAIMED && (
          <>
            <Paragraph>you're already a member!</Paragraph>
            <Paragraph margin="s 0 0">
              don't forget to check out the <a href="/s/twitter">twitter</a> and{" "}
              <a href="/s/discord">discord</a> to know when the first cozy co.
              drop happens.
            </Paragraph>
          </>
        )}

        {mintingState === MintingState.READY && !checkList && (
          <Paragraph>
            <LoadingText>checking the list</LoadingText>
          </Paragraph>
        )}

        {mintingState === MintingState.READY &&
          checkList &&
          !checkList.isOnList && (
            <>
              <Paragraph>sadly you're not on the list right now :(</Paragraph>
              <Paragraph margin="s 0 0">
                the initial round of memberships were only for people who filled
                out a form, and held at least one quilt at the time of a
                snapshot. these requirements may change in future and be open to
                everyone.
              </Paragraph>
            </>
          )}

        {checkList && checkList.isOnList && balance === 0 && (
          <>
            {mintingState === MintingState.READY && (
              <>
                <Paragraph margin="0 0 m">
                  you're on the list! claim your membership card below. it's
                  free, you'll just pay for gas.
                </Paragraph>
                <Button onClick={handleMint}>claim membership card</Button>
              </>
            )}

            {mintingState === MintingState.ERROR && (
              <>
                <Paragraph margin="0 0 m">
                  you're on the list! claim your membership card below. it's
                  free, you'll just pay for gas.
                </Paragraph>
                <Button onClick={handleMint}>claim membership card</Button>
                <Paragraph margin="s 0 0">
                  <small>
                    something went wrong. you can try again but if it persists,
                    reach out on twitter or discord.
                  </small>
                </Paragraph>
              </>
            )}

            {mintingState === MintingState.WAITING && (
              <>
                <Paragraph margin="0 0 m">
                  you're on the list! claim your membership card below. it's
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
                  <strong>nice!</strong> now we wait for ethereum to do it's
                  thing. your membership card should be with you soon. feel free
                  to close this page and check your wallet later.
                </Paragraph>
                <Paragraph margin="s 0 0">
                  don't forget to check out the <a href="/s/twitter">twitter</a>{" "}
                  and <a href="/s/discord">discord</a> to know when the first
                  cozy co. drop happens.
                </Paragraph>
              </>
            )}

            {mintingState === MintingState.CONFIRMED && (
              <>
                <Paragraph>
                  welcome to cozy co. you're now an official member!
                </Paragraph>
                <Paragraph margin="s 0 0">
                  don't forget to check out the <a href="/s/twitter">twitter</a>{" "}
                  and <a href="/s/discord">discord</a> to know when the first
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
