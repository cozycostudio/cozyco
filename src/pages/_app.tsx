import React from "react";
import Head from "next/head";
import type { AppProps } from "next/app";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "styled-components";
import { theme } from "../components/theme";
import { GlobalStyles } from "../components/GlobalStyles";
import { Footer } from "../components/Footer";

function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  const metaTitle = "cozy co.";
  const metaDescription = "a digital studio for all things cozy";
  const metaImage = "https://cozyco.studio/og-image.png";

  return (
    <>
      <Head>
        <title>{metaTitle}</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content={metaImage} />
        <meta property="og:url" content="https://cozyco.studio" />
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:description" content={metaDescription} />
        <meta name="twitter:image" content={metaImage} />
        <meta name="twitter:card" content="summary_large_image" />
        <script
          defer
          data-domain="cozyco.studio"
          src="https://plausible.io/js/plausible.js"
        ></script>
      </Head>
      <ThemeProvider theme={theme}>
        <SessionProvider session={session}>
          <GlobalStyles />
          <Component {...pageProps} />
          <Footer />
        </SessionProvider>
      </ThemeProvider>
    </>
  );
}

export default App;
