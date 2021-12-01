import React, { useEffect, useState } from "react";
import useSWR from "swr";
import { PageContent } from "components/PageContent";
import { H1, H2, Paragraph } from "components/Typography";
import { MaxWidthWrapper } from "components/MaxWidthWrapper";
import { fetcher } from "utils/fetch";
import { MemberListCheckResponse } from "./api/member-list-check";
import { useQueryState } from "hooks/useQueryState";
import { isValidAddress } from "utils/eth";
import { TextInput } from "components/TextInput";
import { Footer } from "components/Footer";

function Index() {
  const [address, setAddress] = useQueryState("address");
  const [isValidatingAddress, setIsValidatingAddress] = useState(false);
  const [validWallet, setValidWallet] = useState(false);

  useEffect(() => {
    if (address) {
      setIsValidatingAddress(true);
      isValidAddress(address)
        .then((isValid) => {
          setValidWallet(isValid);
          setIsValidatingAddress(false);
        })
        .catch((e) => {
          console.error(e);
          setValidWallet(false);
          setIsValidatingAddress(false);
        });
    }
  }, [address]);

  const { data } = useSWR<MemberListCheckResponse>(
    address && validWallet ? `/api/member-list-check?address=${address}` : null,
    fetcher
  );

  return (
    <PageContent>
      <MaxWidthWrapper as="section">
        <H1>cozy co.</H1>
        <Paragraph margin="s 0 0">
          The Stitcher, known for creating{" "}
          <a href="https://quilts.art">quilts on-chain</a>, has created a new
          company for more cozy wares… cozy co.
        </Paragraph>
        <Paragraph margin="s 0 0">
          The sale of quilts did three things. First, it gave him the confidence
          that his cozy items were something that people liked and enjoyed.
          Secondly, it taught him a bunch about community and what it takes to
          make things for others. Thirdly, the funds from the sale itself
          allowed him to launch cozy co.
        </Paragraph>
        <Paragraph margin="s 0 0">
          To reward the folks who helped launch the company, a very limited
          number of special cards will be given out. Each card gives the holder
          exclusive access and discounts on cozy wares. You can use the form
          below to check if you’re on the list for a card. If not, don’t
          fret—more cards will be issued later for upstanding members of the
          community.
        </Paragraph>
        <Paragraph margin="s 0 0">
          Join cozy co. on <a href="/s/twitter">Twitter</a> and{" "}
          <a href="/s/discord">Discord</a> to be informed when the first
          collection drops. There’s still some studio set up to do for now, but
          stop by and say hi!
        </Paragraph>

        <H2 margin="l 0 0">friends of cozy co.</H2>
        <Paragraph>
          Check if you’re on the list for a card when they drop soon.
        </Paragraph>

        <TextInput
          value={address || ""}
          onChange={(e) => setAddress(e.currentTarget.value)}
          placeholder="Ethereum address or ENS domain"
          isLoading={isValidatingAddress || Boolean(address && !data)}
          margin="s 0 0"
        />

        <Paragraph margin="s 0 0">
          <small>
            {data ? (
              <>
                {data.isOnList ? (
                  <>
                    You're on the list!
                    <br />
                    &nbsp;
                  </>
                ) : (
                  <>
                    Looks like you're not on the list right now.
                    <br />
                    Hop in the <a href="/s/discord">Discord</a> and your luck
                    may change!
                  </>
                )}
              </>
            ) : (
              <>
                &nbsp;
                <br />
                &nbsp;
              </>
            )}
          </small>
        </Paragraph>
      </MaxWidthWrapper>

      <Footer />
    </PageContent>
  );
}

export default Index;
