import React from "react";
import Head from "next/head";
import type { AppProps } from "next/app";
import { ThemeProvider } from "styled-components";
import { theme } from "../components/theme";
import { GlobalStyles } from "../components/GlobalStyles";

export interface DefaultPageProps {
  contractHref: string;
  openseaHref: string;
  twitterHref: string;
  discordHref: string;
}

function App({ Component, pageProps }: AppProps) {
  const metaTitle = "Cozy Co.";
  const metaDescription =
    "A place to buy and collect cozy wares for your digital space";

  return (
    <>
      <Head>
        <title>{metaTitle}</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content="https://cozyco.art/og-image.png" />
        <meta property="og:url" content="https://cozyco.art" />
      </Head>
      <ThemeProvider theme={theme}>
        <GlobalStyles />
        <Component {...pageProps} />
      </ThemeProvider>
    </>
  );
}

export default App;
