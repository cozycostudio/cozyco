import styled from "styled-components";

export const PageContent = styled.main`
  flex: 1;
  position: relative;
  z-index: 2;
  background: ${(p) => p.theme.colors.bg};
  padding: ${(p) =>
    `${p.theme.spacing.xl} calc(${p.theme.spacing.s} + 0.5rem) ${p.theme.spacing.xl} ${p.theme.spacing.s}`};

  @media screen and (min-width: ${(p) => p.theme.breakpoints.s}) {
    padding: ${(p) => p.theme.spacing.xl};
  }
`;
