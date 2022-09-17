import "../styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import Layout from "../components/Layout";
import { SessionProvider } from "next-auth/react";
import { RecoilRoot } from "recoil";

interface Props {
  Component: React.FC;
  pageProps: any;
  session: any;
}
function MyApp({ Component, pageProps: { session, ...pageProps } }: Props) {
  return (
    <>
      <Head>
        <title>
          eBoto Mo | An Online Voting System for CvSU Main Campus with Real-time
          Voting Count.
        </title>
      </Head>
      <SessionProvider session={session}>
        <RecoilRoot>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </RecoilRoot>
      </SessionProvider>
    </>
  );
}

export default MyApp;
