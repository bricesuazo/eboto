import { GetServerSideProps, GetServerSidePropsContext } from "next";

const ElectionDashboardPage = () => {
  return <div>ElectionDashboardPage</div>;
};

export default ElectionDashboardPage;

export const getServerSideProps: GetServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  return {
    redirect: {
      destination: "/" + context.query.electionIdName + "/dashboard/overview",
      permanent: false,
    },
  };
};
