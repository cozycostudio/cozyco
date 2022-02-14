import styled from "styled-components";
import withShadows from "./withShadow";
import withMargin from "./withMargin";

export const Callout = styled.div`
  padding: ${(p) => p.theme.spacing.s};
  ${withShadows};
  ${withMargin};
`;
