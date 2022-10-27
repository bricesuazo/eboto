import { doc, getDoc } from "firebase/firestore";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { firestore } from "../../../firebase/firebase";
import { verifyIdToken } from "../../../firebase/firebase-admin";

const ElectionDashboardPage = () => {
  return <div>ElectionDashboardPage</div>;
};

export default ElectionDashboardPage;

export const getServerSideProps: GetServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  // const cookies = context.req.cookies["eboto-mo-auth"];
  // if (cookies) {
  //   const token = await verifyIdToken(cookies || "");

  //   // fetch user data from db
  //   const data = await getDoc(doc(firestore, "admins", token.uid));
  //   const dataSnap = data.data();

  //   if (!dataSnap?.elections) {
  //     return {
  //       redirect: {
  //         destination: "/dashboard",
  //         permanent: false,
  //       },
  //     };
  //   }
  // }

  return {
    redirect: {
      destination: "/" + context.query.electionIdName + "/dashboard/overview",
      permanent: false,
    },
  };
};
