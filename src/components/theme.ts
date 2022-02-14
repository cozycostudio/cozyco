export const theme = {
  breakpoints: {
    xs: "24rem",
    s: "36rem",
    m: "56rem",
    l: "70rem",
  },
  fonts: {
    heading:
      "DomaineDisplayBold, Georgia, serif, Apple Color Emoji, Segoe UI Emoji",
    body: "Mono, ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace",
  },
  fontSizes: {
    xs: "0.75rem",
    s: "1rem",
    m: "1.5rem",
    l: "2rem",
    xl: "3rem",
  },
  colors: {
    fg: "#1A1F1A",
    bg: "#F6E6D5",
    subdued: "rgba(26, 31, 26, 0.5)",
    accent: "#F1AA5D",
  },
  spacing: {
    xs: "0.5rem",
    s: "1rem",
    m: "2rem",
    l: "3rem",
    xl: "4rem",
  },
  maxWidths: {
    s: "32rem",
    m: "40rem",
    l: "64rem",
    xl: "80rem",
  },
};

export type Theme = typeof theme;
