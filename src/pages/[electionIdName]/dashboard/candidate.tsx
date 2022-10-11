import type { NextPage } from "next";
import Head from "next/head";
import DashboardLayout from "../../../layout/DashboardLayout";

const CandidatePage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Candidates | eBoto Mo</title>
      </Head>
      <DashboardLayout title="Candidates">Candidate</DashboardLayout>
    </>
  );
};

export default CandidatePage;
