import Head from "next/head";
import { TwoColumnDivision } from "../components";
import { HowSafeEBoto, SignupCard } from "../components/@signup";

const SignupPage = () => {
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
