import type { NextPage } from "next";
import Head from "next/head";
import DashboardLayout from "../../../layout/DashboardLayout";

const OverviewPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Overview | eBoto Mo</title>
      </Head>
      <DashboardLayout title="Overview">Overview</DashboardLayout>
    </>
  );
};

export default OverviewPage;
