import type { AppProps } from "next/app";
import { ChakraProvider } from "@chakra-ui/react";
import Header from "../components/Header";
import theme from "../theme";
import Head from "next/head";
import { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { FirebaseAppProvider, FirestoreProvider } from "reactfire";
import { app, firestore } from "../firebase/firebase";

export default function MyApp({
  Component,
  pageProps,
}: AppProps<{
  session: Session;
}>) {
  return (
    <>
      <Head>
        <title>
          eBoto Mo | An Online Voting System for Cavite State University - Don
          Severino Delas Alas Campus with Real-time Voting Count.
        </title>
      </Head>
      <SessionProvider session={pageProps.session}>
        <FirebaseAppProvider firebaseApp={app}>
          {/* <FirestoreProvider sdk={firestore}> */}
          <ChakraProvider theme={theme}>
            <Header />
            <Component {...pageProps} />
          </ChakraProvider>
          {/* </FirestoreProvider> */}
        </FirebaseAppProvider>
      </SessionProvider>
    </>
  );
}
