import Head from "next/head";
import TwoColumnDivision from "../components/TwoColumnDivision";
import SigninCard from "../components/@signin/SigninCard";
import RemindersBeforeVoting from "../components/@signin/RemindersBeforeVoting";
import { getSession } from "next-auth/react";
import type { GetServerSideProps, NextPage } from "next";

const SigninPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Sign in your account | eBoto Mo</title>
      </Head>
      <TwoColumnDivision>
        <RemindersBeforeVoting />
        <SigninCard />
      </TwoColumnDivision>
    </>
  );
};

export default SigninPage;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession({ req: context.req });

  if (session) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return {
    props: { session },
  };
};
