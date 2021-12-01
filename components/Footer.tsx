import styled from "styled-components";
import { Paragraph } from "./Typography";

const FooterText = styled(Paragraph)`
  color: ${(p) => p.theme.colors.subdued};
  font-size: ${(p) => p.theme.fontSizes.xs};
  text-align: right;
  margin-top: ${(p) => p.theme.spacing.xl};
`;

export function Footer() {
  return (
    <FooterText>
      a <a href="https://samking.studio">sam king studio</a> project
    </FooterText>
  );
}
