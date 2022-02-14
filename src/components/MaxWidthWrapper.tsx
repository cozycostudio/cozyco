import styled from "styled-components";
import { Theme } from "./theme";
import withMargin from "./withMargin";

interface Props {
  margin?: string;
  maxWidth?: keyof Theme["maxWidths"];
}

export const MaxWidthWrapper = styled.div<Props>`
  max-width: ${(p) =>
    p.maxWidth ? p.theme.maxWidths[p.maxWidth] : p.theme.maxWidths.m};
  ${withMargin};
  margin-left: auto;
  margin-right: auto;
`;
