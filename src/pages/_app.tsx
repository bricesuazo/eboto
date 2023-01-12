import { ChakraProvider } from "@chakra-ui/react";
import { Inter } from "@next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import type { AppProps } from "next/app";
import Head from "next/head";
import "react-datepicker/dist/react-datepicker.css";
import { FirebaseAppProvider } from "reactfire";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { app } from "../firebase/firebase";
import "../styles/globals.css";
import theme from "../theme";
import NextNProgress from "nextjs-progressbar";

// const anton = Anton({ weight: "400" });
const inter = Inter();
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
            <main className={inter.className}>
              <NextNProgress color="#ffd532" height={2} />
              <Header />
              <Component {...pageProps} />
              <Footer />
            </main>
            <Analytics />
          </ChakraProvider>
          {/* </FirestoreProvider> */}
        </FirebaseAppProvider>
      </SessionProvider>
    </>
  );
}
