import { GetServerSidePropsContext } from "next";
import { doc, getDoc } from "firebase/firestore";
import { getSession } from "next-auth/react";
import { firestore } from "../firebase/firebase";

const dashboardRedirect = async (context: GetServerSidePropsContext) => {
  const session = await getSession(context);
  if (!session) {
    return {
      redirect: {
        destination: "/signin",
        permanent: false,
      },
    };
  } else if (session.user.accountType === "voter") {
    const electionSnap = await getDoc(
      doc(firestore, "elections", session.user.election)
    );
    const election = electionSnap.data();
    return {
      redirect: {
        destination: `/${election?.electionIdName}`,
        permanent: false,
      },
    };
  }
};

export default dashboardRedirect;
