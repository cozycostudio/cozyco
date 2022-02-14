import React from "react";
import Link from "next/link";
import { PageContent } from "../components/PageContent";
import { Paragraph } from "../components/Typography";
import { MaxWidthWrapper } from "../components/MaxWidthWrapper";
import { LinkButton } from "../components/Button";
import { Header } from "../components/Header";

function Index() {
  return (
    <PageContent>
      <Header />
      <MaxWidthWrapper as="section">
        <Paragraph>
          The Quilt Stitcher, known for creating{" "}
          <a href="https://quilts.art">quilts on-chain</a>, has created a new
          company for more cozy wares… cozy co. When quilts sold out, it gave
          him confidence that his cozy items were something that people enjoyed.
        </Paragraph>
        <Paragraph margin="s 0 0">
          To reward the folks who helped launch the new company, a very limited
          number of special cards are available. Each card gives the holder
          exclusive access and discounts on cozy wares.
        </Paragraph>

        <Link href="/join" passHref>
          <LinkButton margin="m 0 0">join cozy co.</LinkButton>
        </Link>
      </MaxWidthWrapper>
    </PageContent>
  );
}

export default Index;
