import styled from "styled-components";

const Link = styled.a`
  display: block;
  width: 34px;
  height: 34px;

  path {
    fill: #f1aa5d;
    transition: fill 150ms ease-in-out;
  }

  &:hover path {
    fill: ${(p) => p.theme.colors.fg};
  }
`;

export function DiscordLinkIcon() {
  return (
    <Link href="/s/discord">
      <svg
        width="34"
        height="34"
        viewBox="0 0 34 34"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M28.0894 7.07236C26.0498 6.11316 23.8626 5.40646 21.5759 5.0017C21.5342 4.99389 21.4926 5.01341 21.4712 5.05245C21.1899 5.56523 20.8783 6.23419 20.6601 6.75999C18.2005 6.38257 15.7536 6.38257 13.3444 6.75999C13.1262 6.2225 12.8033 5.56523 12.5208 5.05245C12.4993 5.01471 12.4577 4.99519 12.4161 5.0017C10.1305 5.40516 7.94341 6.11186 5.90258 7.07236C5.88491 7.08017 5.86977 7.0932 5.85972 7.11011C1.71119 13.4627 0.574733 19.6591 1.13224 25.7787C1.13476 25.8086 1.15116 25.8372 1.17386 25.8554C3.91095 27.9157 6.56228 29.1664 9.16437 29.9954C9.20602 30.0085 9.25014 29.9929 9.27664 29.9577C9.89217 29.0962 10.4409 28.1877 10.9113 27.2324C10.9391 27.1764 10.9126 27.1101 10.8558 27.0879C9.98551 26.7496 9.1568 26.337 8.35964 25.8685C8.29659 25.8307 8.29154 25.7383 8.34954 25.694C8.5173 25.5652 8.68509 25.4311 8.84527 25.2958C8.87425 25.2711 8.91464 25.2658 8.94871 25.2815C14.1857 27.7322 19.8554 27.7322 25.0306 25.2815C25.0647 25.2645 25.1051 25.2698 25.1353 25.2945C25.2955 25.4298 25.4633 25.5652 25.6323 25.694C25.6903 25.7383 25.6865 25.8307 25.6235 25.8685C24.8263 26.3461 23.9976 26.7496 23.126 27.0866C23.0693 27.1088 23.044 27.1764 23.0718 27.2324C23.5523 28.1864 24.101 29.0948 24.7052 29.9564C24.7304 29.9929 24.7758 30.0085 24.8175 29.9954C27.4322 29.1664 30.0835 27.9157 32.8206 25.8554C32.8446 25.8372 32.8597 25.8099 32.8622 25.7799C33.5294 18.705 31.7447 12.5594 28.131 7.1114C28.1221 7.0932 28.107 7.08017 28.0894 7.07236ZM11.6934 22.0525C10.1167 22.0525 8.81751 20.5688 8.81751 18.7467C8.81751 16.9246 10.0915 15.4409 11.6934 15.4409C13.3078 15.4409 14.5944 16.9376 14.5692 18.7467C14.5692 20.5688 13.2952 22.0525 11.6934 22.0525ZM22.3263 22.0525C20.7497 22.0525 19.4505 20.5688 19.4505 18.7467C19.4505 16.9246 20.7244 15.4409 22.3263 15.4409C23.9408 15.4409 25.2274 16.9376 25.2022 18.7467C25.2022 20.5688 23.9408 22.0525 22.3263 22.0525Z" />
      </svg>
    </Link>
  );
}
