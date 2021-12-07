import styled, { keyframes } from "styled-components";

const elipsis = keyframes`
  to {
    width: 0.8em;
}
`;

export const LoadingText = styled.span`
  &:after {
    overflow: hidden;
    display: inline-block;
    vertical-align: bottom;
    animation: ${elipsis} steps(4, end) 900ms infinite;
    content: "…"; /* ascii code for the ellipsis character */
    width: 0;
  }
`;
