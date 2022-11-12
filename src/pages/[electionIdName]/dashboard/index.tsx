import { GetServerSideProps, GetServerSidePropsContext } from "next";
import dashboardRedirect from "../../../utils/dashboardRedirect";

const ElectionDashboardPage = () => {
  return <div>ElectionDashboardPage</div>;
};

export default ElectionDashboardPage;

export const getServerSideProps: GetServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const redirect = await dashboardRedirect(context);
  if (redirect) {
    return redirect;
  }

  return {
    redirect: {
      destination: `/${context.query.electionIdName}/dashboard/overview`,
      permanent: false,
    },
  };
};
