import { css } from "styled-components";
import { theme } from "./theme";

export interface WithMarginProp {
  margin?: string;
}

interface SizeMap {
  [K: string]: string;
}

const sizes: SizeMap = theme.spacing;

export default function withMargin({ margin = "" }: WithMarginProp) {
  const trimmedMargin = margin.trim();

  if (!trimmedMargin) {
    return "";
  }

  const margins: string[] = trimmedMargin
    .split(" ")
    .filter(Boolean)
    .map((sizeStr: string) => {
      if (!sizeStr) return "";

      let size = sizeStr.trim();
      let isNegative = false;

      if (size.startsWith("-") && size.split("-").length > 1) {
        isNegative = true;
        size = size.split("-")[1];
      }

      if (Object.keys(sizes).includes(size)) {
        return isNegative ? `-${sizes[size]}` : sizes[size];
      } else if (size === "0") {
        return "0";
      } else if (size === "auto") {
        return "auto";
      } else {
        return "";
      }
    });

  switch (margins.slice(0, 4).length) {
    case 1:
      return css`
        margin: ${margins[0]};
      `;
    case 2:
      return css`
        margin: ${margins[0]} ${margins[1]};
      `;
    case 3:
      return css`
        margin: ${margins[0]} ${margins[1]} ${margins[2]};
      `;
    case 4:
      return css`
        margin: ${margins[0]} ${margins[1]} ${margins[2]} ${margins[3]};
      `;
    default:
      return css`
        margin: 0;
      `;
  }
}
