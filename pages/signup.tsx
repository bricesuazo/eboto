import Head from "next/head";
import TwoColumnDivision from "../components/TwoColumnDivision";
import HowSafeEBoto from "../components/@signup/HowSafeEBoto";
import SignupCard from "../components/@signup/SignupCard";
import { getSession } from "next-auth/react";
import type { GetServerSideProps, NextPage } from "next";

const SignupPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Create account as an admin | eBoto Mo</title>
      </Head>
      <TwoColumnDivision>
        <HowSafeEBoto />
        <SignupCard />
      </TwoColumnDivision>
    </>
  );
};

export default SignupPage;

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
    props: {
      session,
    },
  };
};
