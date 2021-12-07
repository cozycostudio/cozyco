import styled, { css } from "styled-components";
import { LoadingIndicator } from "./LoadingIndicator";
import withMargin from "./withMargin";

const InputWrapper = styled.div<{ margin?: string }>`
  position: relative;
  ${withMargin};
`;

const LoadingWrapper = styled.div`
  position: absolute;
  top: 0;
  right: calc(${(p) => p.theme.spacing.s} + 0.25rem);
  bottom: 0;
  display: flex;
  align-items: center;
`;

interface Props extends React.HTMLProps<HTMLInputElement> {
  isLoading?: boolean;
  margin?: string;
}

export const TextInput = styled(({ margin, isLoading, ...props }: Props) => (
  <InputWrapper margin={margin}>
    <input {...props} />
    {isLoading && (
      <LoadingWrapper>
        <LoadingIndicator />
      </LoadingWrapper>
    )}
  </InputWrapper>
))`
  width: 100%;
  font-size: ${(p) => p.theme.fontSizes.s};
  font-family: ${(p) => p.theme.fonts.body};
  line-height: 1.5;
  color: ${(p) => p.theme.colors.fg};
  outline: none;
  resize: vertical;
  -webkit-appearance: none;

  padding: ${(p) => p.theme.spacing.s};
  ${(p) =>
    p.isLoading &&
    css`
      padding-right: ${p.theme.spacing.l};
    `}
  background-color: white;
  border-radius: 0.5rem;
  overflow: hidden;
  border: 0.25rem solid ${(p) => p.theme.colors.fg};
  box-shadow: 0.25rem 0.25rem 0 0 ${(p) => p.theme.colors.fg};
  transition: border 150ms ease, box-shadow 150ms ease, transform 150ms ease;

  &:hover,
  &:focus-visible {
    transform: translate3d(-0.125rem, -0.125rem, 0);
    box-shadow: 0.375rem 0.375rem 0 0 ${(p) => p.theme.colors.fg};
  }
`;
