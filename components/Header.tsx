import Link from "next/link";
import React from "react";
import styled from "styled-components";
import { DiscordLinkIcon } from "./DiscordLinkIcon";
import { Quilty } from "./Quilty";
import { TwitterLinkIcon } from "./TwitterLinkIcon";
import { H1, H2 } from "./Typography";

const Wrapper = styled.header`
  max-width: ${(p) => p.theme.maxWidths.m};
  margin-left: auto;
  margin-right: auto;
  margin-bottom: ${(p) => p.theme.spacing.m};
`;

const TopRow = styled.div`
  display: grid;
  grid-template-columns: 1fr max-content;
  gap: ${(p) => p.theme.spacing.s};
  align-items: center;
`;

const LinkWrapper = styled.nav`
  display: grid;
  grid-template-columns: max-content max-content;
  gap: ${(p) => p.theme.spacing.s};
  align-items: center;
`;

interface Props {
  subPageTitle?: string;
}

export function Header({ subPageTitle }: Props) {
  return (
    <Wrapper>
      <TopRow>
        <div>
          <Link href="/">
            <a>
              <Quilty />
            </a>
          </Link>
        </div>
        <LinkWrapper>
          <DiscordLinkIcon />
          <TwitterLinkIcon />
        </LinkWrapper>
      </TopRow>
      {subPageTitle ? (
        <H2 margin="s 0 0">{subPageTitle}</H2>
      ) : (
        <H1>cozy co.</H1>
      )}
    </Wrapper>
  );
}
