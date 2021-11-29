import React, { useEffect, useState } from "react";
import useSWR from "swr";
import styled from "styled-components";
import { PageContent } from "../components/PageContent";
import { Paragraph } from "../components/Typography";
import { MaxWidthWrapper } from "../components/MaxWidthWrapper";
import { fetcher } from "../utils/fetch";
import { MemberListCheckResponse } from "./api/member-list-check";
import { useQueryState } from "next-usequerystate";
import { isValidAddress } from "../utils/eth";
import { TextInput } from "../components/TextInput";
import { CozyCoLogo } from "../components/CozyCoLogo";
import { Callout } from "../components/Callout";

const LogoContainer = styled.div`
  width: 200px;
`;

function Index() {
  const [walletAddress, setWalletAdress] = useQueryState("address");
  const [isValidatingWallet, setIsValidatingWallet] = useState(false);
  const [validWallet, setValidWallet] = useState(false);

  useEffect(() => {
    if (walletAddress) {
      setIsValidatingWallet(true);
      isValidAddress(walletAddress)
        .then((isValid) => {
          setValidWallet(isValid);
          setIsValidatingWallet(false);
        })
        .catch((e) => {
          console.error(e);
          setValidWallet(false);
          setIsValidatingWallet(false);
        });
    }
  }, [walletAddress]);

  const { data } = useSWR<MemberListCheckResponse>(
    walletAddress && validWallet
      ? `/api/member-list-check?address=${walletAddress}`
      : null,
    fetcher
  );

  return (
    <PageContent>
      <MaxWidthWrapper as="section">
        <LogoContainer>
          <CozyCoLogo />
        </LogoContainer>
        <Paragraph>
          Check if you're on the membership list… tokens coming soon…
        </Paragraph>

        <TextInput
          value={walletAddress || ""}
          onChange={(e) => setWalletAdress(e.currentTarget.value)}
          placeholder="Wallet address or ENS"
          isLoading={isValidatingWallet || Boolean(walletAddress && !data)}
          margin="s 0 0"
        />

        {data && (
          <Callout margin="s 0 0">
            {data.isOnList ? (
              <Paragraph>You're on the list!</Paragraph>
            ) : (
              <Paragraph>
                Looks like you're not on the list right now. Hop in the{" "}
                <a href="https://quilts.art/discord">Discord</a> and your luck
                may change 👀.
              </Paragraph>
            )}
          </Callout>
        )}
      </MaxWidthWrapper>
    </PageContent>
  );
}

export default Index;
