import { css } from "styled-components";

export default function withShadows() {
  return css`
    background: white;
    border: 0.25rem solid ${(p) => p.theme.colors.fg};
    box-shadow: 0.5rem 0.5rem 0 0 ${(p) => p.theme.colors.fg};
    border-radius: 0.5rem;
    overflow: hidden;
  `;
}
