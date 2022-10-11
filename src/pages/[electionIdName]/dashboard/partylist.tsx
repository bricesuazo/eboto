import type { NextPage } from "next";
import Head from "next/head";
import DashboardLayout from "../../../layout/DashboardLayout";

const PartylistPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Partylists | eBoto Mo</title>
      </Head>
      <DashboardLayout title="Partylists">Partylist</DashboardLayout>
    </>
  );
};

export default PartylistPage;
