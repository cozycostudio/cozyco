import styled, { keyframes } from "styled-components";
import withMargin from "./withMargin";

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

export const LoadingIndicator = styled.span<{ margin?: string }>`
  width: ${(p) => p.theme.spacing.s};
  height: ${(p) => p.theme.spacing.s};
  display: inline-block;
  position: relative;
  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    border-radius: 100%;
    border-top: 2px solid ${(p) => p.theme.colors.fg};
    border-left: 2px solid transparent;
    border-bottom: 2px solid transparent;
    border-right: 2px solid transparent;
    animation: ${rotate} 650ms ease-in-out infinite;
  }
  ${withMargin};
`;
