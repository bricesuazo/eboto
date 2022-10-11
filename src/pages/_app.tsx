import type { AppProps } from "next/app";
import { ChakraProvider } from "@chakra-ui/react";
import Header from "../components/Header";
import theme from "../theme";
import useAuth from "../hooks/useAuth";
import Head from "next/head";

function MyApp({ Component, pageProps }: AppProps) {
  useAuth();

  return (
    <>
      <Head>
        <title>
          eBoto Mo | An Online Voting System for Cavite State University - Don
          Severino Delas Alas Campus with Real-time Voting Count.
        </title>
      </Head>
      <ChakraProvider theme={theme}>
        <Header />
        <Component {...pageProps} />
      </ChakraProvider>
    </>
  );
}

export default MyApp;
