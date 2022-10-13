import { doc, getDoc } from "firebase/firestore";
import type { GetServerSideProps, GetServerSidePropsContext } from "next";
import { getSession } from "next-auth/react";
import CreateElectionModal from "../components/CreateElectionModal";
import { firestore } from "../firebase/firebase";

const CreateElectionPage = () => {
  return (
    <CreateElectionModal isOpen={true} cantClose={true} onClose={() => {}} />
  );
};

export default CreateElectionPage;

export const getServerSideProps: GetServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const session = await getSession(context);
  if (!session) {
    return {
      redirect: {
        destination: "/signin",
        permanent: false,
      },
    };
  }

  if (session.user.accountType === "voter") {
    // get data from firestore
    const electionSnapshot = await getDoc(
      doc(firestore, "elections", session.user.election)
    );
    return {
      redirect: {
        destination: "/" + electionSnapshot.data()?.electionIdName,
        permanent: false,
      },
    };
  }

  if (
    session.user.accountType === "admin" &&
    session.user.elections.length > 0
  ) {
    // get data from firestore
    const electionSnapshot = await getDoc(
      doc(firestore, "elections", session.user.elections[0])
    );
    return {
      redirect: {
        destination:
          "/" + electionSnapshot.data()?.electionIdName + "/dashboard",
        permanent: false,
      },
    };
  }
  return {
    props: {},
  };
};
