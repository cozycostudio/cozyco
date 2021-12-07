import styled from "styled-components";
import { Paragraph } from "./Typography";

const FooterWrapper = styled.footer`
  padding: ${(p) =>
    `${p.theme.spacing.xl} calc(${p.theme.spacing.s} + 0.5rem) ${p.theme.spacing.xl} ${p.theme.spacing.s}`};
  text-align: right;

  @media screen and (min-width: ${(p) => p.theme.breakpoints.s}) {
    padding: ${(p) => p.theme.spacing.xl};
  }
`;

const FooterText = styled(Paragraph)`
  color: ${(p) => p.theme.colors.subdued};
  font-size: ${(p) => p.theme.fontSizes.xs};
`;

export function Footer() {
  return (
    <FooterWrapper>
      <FooterText>
        a <a href="https://samking.studio">sam king studio</a> project
      </FooterText>
    </FooterWrapper>
  );
}
