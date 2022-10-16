import type { NextPage } from "next";
import Head from "next/head";
import DashboardLayout from "../../../layout/DashboardLayout";

const PositionPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Position | eBoto Mo</title>
      </Head>
      <DashboardLayout title="Position">Position</DashboardLayout>
    </>
  );
};

export default PositionPage;
