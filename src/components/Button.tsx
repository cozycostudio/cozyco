import styled, { css } from "styled-components";
import withMargin from "./withMargin";

interface ButtonProps {
  margin?: string;
}

const baseButtonStyles = css`
  display: inline-block;
  margin: 0;
  text-decoration: none;
  font-family: ${(p) => p.theme.fonts.body};
  font-weight: normal;
  cursor: pointer;
  text-align: center;
  background: white;
  color: ${(p) => p.theme.colors.fg};
  -webkit-appearance: none;
  -moz-appearance: none;
  outline: none;
  overflow: hidden;
  cursor: pointer;
`;

const buttonStyles = css<ButtonProps>`
  padding: ${(p) => p.theme.spacing.s} ${(p) => p.theme.spacing.m};
  font-size: ${(p) => p.theme.fontSizes.s};
  border: 0.25rem solid ${(p) => p.theme.colors.fg};
  box-shadow: 0.25rem 0.25rem 0 0 ${(p) => p.theme.colors.fg};
  transition: border 150ms ease, box-shadow 150ms ease, transform 150ms ease;
  border-radius: 0.5rem;
  background-color: white;

  &:hover:not(:disabled),
  &:focus-visible {
    transform: translate3d(-0.125rem, -0.125rem, 0);
    box-shadow: 0.375rem 0.375rem 0 0 ${(p) => p.theme.colors.fg};
  }

  &:active {
    transform: translate3d(0.25rem, 0.25rem, 0);
    box-shadow: 0.25rem 0.25rem 0 0 ${(p) => p.theme.colors.fg};
  }

  &:disabled {
    background: #b4b4b4;
    cursor: default;
  }
`;

export const Button = styled.button<ButtonProps>`
  ${baseButtonStyles};
  ${buttonStyles};
  ${withMargin};
`;

export const LinkButton = styled.a<ButtonProps>`
  ${baseButtonStyles};
  ${buttonStyles};
  position: relative;
  text-decoration: none;
  ${withMargin};
`;
