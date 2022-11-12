import type { GetServerSideProps, GetServerSidePropsContext } from "next";
import { getSession } from "next-auth/react";
import Head from "next/head";
import DashboardLayout from "../../../layout/DashboardLayout";
import { adminType } from "../../../types/typings";

const OverviewPage = ({
  session,
}: {
  session: { user: adminType; expires: string };
}) => {
  return (
    <>
      <Head>
        <title>Overview | eBoto Mo</title>
      </Head>
      <DashboardLayout title="Overview" session={session}>
        Overview
      </DashboardLayout>
    </>
  );
};

export default OverviewPage;

export const getServerSideProps: GetServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  return { props: { session: await getSession(context) } };
};
