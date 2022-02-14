import styled from "styled-components";
import withMargin from "./withMargin";

interface TypographyProps {
  margin?: string;
}

export const H1 = styled.h1<TypographyProps>`
  font-size: ${(p) => p.theme.fontSizes.xl};
  font-family: ${(p) => p.theme.fonts.heading};
  font-style: italic;
  margin: 0;
  ${withMargin};
`;

export const H2 = styled.h2<TypographyProps>`
  font-size: ${(p) => p.theme.fontSizes.l};
  font-family: ${(p) => p.theme.fonts.body};
  margin: 0;
  ${withMargin};
`;

export const H3 = styled.h3<TypographyProps>`
  font-size: ${(p) => p.theme.fontSizes.m};
  font-family: ${(p) => p.theme.fonts.body};
  margin: 0;
  ${withMargin};
`;

export const H4 = styled.h4<TypographyProps>`
  font-size: ${(p) => p.theme.fontSizes.s};
  font-family: ${(p) => p.theme.fonts.body};
  margin: 0;
  ${withMargin};
`;

export const Paragraph = styled.p<TypographyProps>`
  font-family: ${(p) => p.theme.fonts.body};
  margin: 0;
  ${withMargin};
`;

export const LongWord = styled.span`
  overflow-wrap: break-word;
`;
