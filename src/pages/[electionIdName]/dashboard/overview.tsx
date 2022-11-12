import type { GetServerSideProps, GetServerSidePropsContext } from "next";
import { Session } from "next-auth";
import { getSession } from "next-auth/react";
import Head from "next/head";
import DashboardLayout from "../../../layout/DashboardLayout";
import dashboardRedirect from "../../../utils/dashboardRedirect";

const OverviewPage = ({ session }: { session: Session }) => {
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
  const redirect = await dashboardRedirect(context);
  if (redirect) {
    return redirect;
  }

  return { props: { session: await getSession(context) } };
};
