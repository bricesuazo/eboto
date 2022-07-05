import Head from "next/head";
import { TwoColumnDivision } from "../components";
import { SigninCard, RemindersBeforeVoting } from "../components/@signin";

const SigninPage = () => {
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
