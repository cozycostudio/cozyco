import React from "react";
import Head from "next/head";
import Image from "next/image";
import styled from "styled-components";
import { PageContent } from "../../components/PageContent";
import { H2, H3, H4, Paragraph } from "../../components/Typography";
import { MaxWidthWrapper } from "../../components/MaxWidthWrapper";
import { Header } from "../../components/Header";

const ImageWrapper = styled.div`
  margin: ${(p) => p.theme.spacing.m} 0;
`;

function QuiltsTwoPointOh() {
  const metaTitle = "quilts 2.0 - customization";
  const metaDescription =
    "I thought I'd give a more detailed update on the things I've been working on and thinking about since the initial Quilts release back in October.";
  const metaImage = "https://cozyco.studio/og-image-community-update-1.png";

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
        <Paragraph>community update: january 20, 2022</Paragraph>
        <H2>quilts 2.0 - customization</H2>
        <Paragraph margin="m 0 0">
          I thought I'd give a more detailed update on the things I've been
          working on and thinking about since the initial Quilts release back in
          October.
        </Paragraph>
        <Paragraph margin="s 0 0">
          I never expected Quilts to sell out as it was always intended to be an
          experiment with no roadmap, the aim being to see what could be done
          on-chain. The enthusiasm around the release gave me more confidence
          that there could be something fun there. Before releasing Quilts
          though, I had already committed to going back to work full-time, but
          that didn't stop a few of us in the Discord talking about ideas for
          further iterations.
        </Paragraph>
        <Paragraph margin="s 0 0">
          One of the ideas that stuck out to me from the start was the ability
          for people to create their own quilts. I think this will actually be a
          big part of the next wave of NFTs where collectors will have influence
          over the artworks that get created. Whether that being full control
          over what a piece looks like, or seeding the data somehow.
        </Paragraph>
        <Paragraph margin="s 0 0">
          I've been doing some research and writing some code when I've had
          time, and I've had a bunch of ideas in the process. I'd love to share
          a bit more about what I've been doing, and get peoples thoughts and
          ideas. Obviously I'm still working full-time so getting time to work
          on this without completely burning myself out is still a hurdle, and
          as always I'm hesitant to promise anything. Having said that, I think
          it's important for the community (yes, you) to be involved in building
          this with me.
        </Paragraph>

        <H3 margin="m 0 0">so… what's the plan?</H3>

        <H4 margin="s 0 0">cozy co supply store</H4>
        <Paragraph margin="s 0 0">
          It all starts with the <strong>cozy co quilt supply store</strong>{" "}
          contract. This is kind of like a marketplace where supplies needed to
          create a quilt are purchased. Supplies could be patches, stitching,
          backgrounds, maybe even special effects or "power ups". These
          collections of supplies will be released seasonally starting with a
          Genesis collection. The aim is to work with other artists to
          collaborate on new collections over time. Artists will get the
          majority of the sales, with a small percentage being reserved for
          funding new cozy co projects or community projects.
        </Paragraph>

        <H4 margin="s 0 0">community supply store</H4>
        <Paragraph margin="s 0 0">
          Next up is the <strong>community quilt supply store</strong>. Similar
          concept but it would allow anyone to create supplies for quilts.
          They'll be able to choose how many are available for sale and how much
          they cost. Creators will also be paid for sales they generate with
          cozy co taking 5-10% (would love input here) for future
          development/community funding. That's a 90-95% artist cut! The
          community contract still needs some more research (but I think it's
          possible), and it probably needs a way to be moderated for obvious
          reasons.
        </Paragraph>

        <H4 margin="s 0 0">quilt making</H4>
        <Paragraph margin="s 0 0">
          Now for where it's all put together, the <strong>quilt maker</strong>{" "}
          contract. This is where you put all your supplies together into a
          single quilt. When you "stitch together a new quilt", you essentially
          transfer your supply tokens to the contract, and it mints your quilt
          for you. If you decide you want to swap supplies out, the contract
          will return any unused supplies to you. You could also just keep
          making brand new quilts as new supplies are released. I've got some
          interesting ideas regarding recycling/swapping supplies that I want to
          experiment with.
        </Paragraph>

        <ImageWrapper>
          <Image src="/token-layout.png" width="896" height="402" />
        </ImageWrapper>

        <Paragraph>
          My initial thinking around the total supply is that there will be a
          limited number of quilts available to create, say 50x 2x2 quilts, 200x
          4x4 etc. I would love to hear what people think about this mechanic
          though. Another option is doing "open hours" where The Quilt Stitcher
          only offers his services at select times during the week, or a certain
          amount each week.
        </Paragraph>
        <Paragraph margin="s 0 0">
          The cool part about the quilt maker contract is that it will use a
          separate, upgradeable rendering contract. This means the supply stores
          can offer new types of supplies over time that can then be supported
          by the quilt maker renderer. An early release might only support
          patches and backgrounds, but could later support stitching colors and
          power ups etc.
        </Paragraph>

        <H3 margin="m 0 0">how much is this going to cost?</H3>
        <Paragraph margin="s 0 0">
          The exact economics haven't been decided just yet. Each supply item
          can have it's own price which is set at the time of "stocking in" that
          item to the store. The supply stores will use ERC-1155 for the tokens
          so batch purchasing should be cheaper.
        </Paragraph>
        <Paragraph margin="s 0 0">
          As for quilt making, again this hasn't been decided yet. I don't want
          this to be cost prohibitive, but there are some fun mechanics I've
          been thinking about that could be rewarding, and make it cheaper for
          quilt making enthusiasts!
        </Paragraph>

        <H3 margin="m 0 0">what about membership holders?</H3>
        <Paragraph margin="s 0 0">
          In my proof of concepts so far, members of cozy co. have the potential
          to get discounts, and exclusive supplies. All supplies support this
          discount and exclusivity mechanic by default, but for artist
          collaborations, it will be up to the artist if they want to make use
          of this. Every cozy co. collection will feature member discounts as a
          thank you for supporting the project!
        </Paragraph>

        <H3 margin="m 0 0">and quilt holders?</H3>
        <Paragraph margin="s 0 0">
          Same as above. There might be collections that are only available to
          quilt holders. I've also had an idea about getting patches from your
          current quilt into this new system - an OG patch collection if you
          will. You can bring those coveted kitty patches along with you!
        </Paragraph>

        <H3 margin="m 0 0">feedback</H3>
        <Paragraph margin="s 0 0">
          Obviously this will take some time for me to put together, but that
          brings with it the ability for you to have an impact in the direction
          of this project. I want to know what you think of the ideas spoken
          about today, and any other ways we can make this more fun and
          inclusive!
        </Paragraph>
        <Paragraph margin="s 0 0">
          Also if you're interested in building any of this with me, then DM the
          @cozycostudio twitter, or hop in the Discord. I would love to speak to
          community managers especially as the community contract is one of the
          things I'm most excited about.
        </Paragraph>

        <H3 margin="m 0 s">summary</H3>
        <ul>
          <li>
            ERC-1155 store contract for official cozy co supplies and artist
            collaboration supplies
          </li>
          <li>
            ERC-1155 store contract for community created supplies (will likely
            be launched at a later date)
          </li>
          <li>
            Support for other supply stores in future e.g. token gated stores
          </li>
          <li>ERC-721 quilt maker contract</li>
          <li>
            Quilt maker contract holds onto supplies so they can be returned
            when quilts are recycled (no burning of supplies)
          </li>
          <li>
            Separate quilt rendering contract to support different types of
            supplies in future
          </li>
          <li>Member discounts and exclusives</li>
          <li>All coming soon!</li>
        </ul>

        <Paragraph margin="m 0 0">
          Much love, and stay cozy!
          <br />
          Sam (aka The Quilt Stitcher)
        </Paragraph>
      </MaxWidthWrapper>
    </PageContent>
  );
}

export default QuiltsTwoPointOh;
