import React from "react";
import Head from "next/head";
import type { AppProps } from "next/app";
import { ThemeProvider } from "styled-components";
import { Web3ReactProvider } from "@web3-react/core";
import Web3ReactManager from "../providers/Web3ReactManager";
import ModalManager from "../providers/ModalManager";
import MintManager from "../providers/MintManager";
import getLibrary from "../utils/getLibrary";
import { theme } from "../components/theme";
import { GlobalStyles } from "../components/GlobalStyles";
import { Footer } from "../components/Footer";

export interface DefaultPageProps {
  contractHref: string;
  openseaHref: string;
  twitterHref: string;
  discordHref: string;
}

function App({ Component, pageProps }: AppProps) {
  const metaTitle = "cozy co.";
  const metaDescription =
    "A place to buy and collect cozy wares for your digital space… coming soon";

  return (
    <>
      <Head>
        <title>{metaTitle}</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta
          property="og:image"
          content="https://cozyco.studio/og-image.png"
        />
        <meta property="og:url" content="https://cozyco.studio" />
      </Head>
      <ThemeProvider theme={theme}>
        <Web3ReactProvider getLibrary={getLibrary}>
          <Web3ReactManager>
            <ModalManager>
              <MintManager>
                <GlobalStyles />
                <Component {...pageProps} />
                <Footer />
              </MintManager>
            </ModalManager>
          </Web3ReactManager>
        </Web3ReactProvider>
      </ThemeProvider>
    </>
  );
}

export default App;
