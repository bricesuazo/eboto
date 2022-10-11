import { firestore } from "../firebase/firebase";
import type { GetServerSideProps, GetServerSidePropsContext } from "next";
import { verifyIdToken } from "../firebase/firebase-admin";
import { doc, getDoc } from "firebase/firestore";
import CreateElectionModal from "../components/CreateElectionModal";
import { useDisclosure } from "@chakra-ui/react";

const DashboardPage = () => {
  const { onClose, isOpen } = useDisclosure();
  return (
    <>
      <CreateElectionModal cantClose onClose={onClose} isOpen={isOpen} />
    </>
  );
};

export default DashboardPage;

export const getServerSideProps: GetServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const cookies = context.req.cookies["eboto-mo-auth"];

  if (cookies) {
    const token = await verifyIdToken(cookies || "");

    // fetch user data from db
    const data = await getDoc(doc(firestore, "admins", token.uid));
    const dataSnap = data.data();

    if (dataSnap?.elections.length !== 0) {
      // fetch electionIdName
      const election = await getDoc(
        doc(firestore, "elections", dataSnap?.elections[0])
      );
      const electionSnap = election.data();

      if (electionSnap) {
        return {
          redirect: {
            destination: "/" + electionSnap?.electionIdName + "/dashboard",
            permanent: false,
          },
        };
      } else {
        return {
          notFound: true,
        };
      }
    }
  } else {
    return {
      redirect: {
        destination: "/signin",
        permanent: false,
      },
    };
  }
  return { props: {} };
};
