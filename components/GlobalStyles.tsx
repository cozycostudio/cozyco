import { createGlobalStyle } from "styled-components";

export const GlobalStyles = createGlobalStyle`
  @font-face {
    font-family: Mono;
    font-display: fallback;
    src: url(/fonts/GT-America-Mono.woff) format("woff"),
      url(/fonts/GT-America-Mono.woff2) format("woff2");
    font-style: normal;
    font-weight: normal;
  }

  @font-face {
    font-family: Mono;
    font-display: fallback;
    src: url(/fonts/GT-America-Mono-Bold.woff) format("woff"),
      url(/fonts/GT-America-Mono-Bold.woff2) format("woff2");
    font-style: normal;
    font-weight: bold;
  }

  * {
    padding: 0;
    margin: 0;
  }

  *, *:before, *:after {
    box-sizing: border-box;
  }

  html {
    background: ${(p) => p.theme.colors.bg};
  }
  
  body {
    font-family: ${(p) => p.theme.fonts.body};
    font-size: 16px;
    line-height: 1.5;
    color: ${(p) => p.theme.colors.fg};
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    -webkit-tap-highlight-color: rgba(255, 255, 255, 0); 
  }

  button, input[type="submit"], input[type="reset"] {
    background: none;
    color: inherit;
    border: none;
    padding: 0;
    font: inherit;
    cursor: pointer;
    outline: inherit;
  }

  a {
    color: inherit;
  }
`;
