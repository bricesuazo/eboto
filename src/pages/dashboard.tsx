import { firestore } from "../firebase/firebase";
import type { GetServerSideProps, GetServerSidePropsContext } from "next";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { getSession } from "next-auth/react";
import { Box, Text } from "@chakra-ui/react";
import { electionType } from "../types/typings";
import Link from "next/link";
import Moment from "react-moment";

const DashboardPage = ({ elections }: { elections: electionType[] }) => {
  return (
    <Box padding={4}>
      <Text mb={4}>Your elections</Text>

      <Box>
        {elections.map((election) => (
          <Link
            href={`/${election.electionIdName}/dashboard/`}
            key={election.id}
          >
            <Box
              key={election.id}
              padding={4}
              backgroundColor="blue.800"
              borderRadius="lg"
              width={300}
            >
              <Text fontWeight="bold">{election.name}</Text>
              <Text fontSize="sm" width="full" color="gray.400">
                <Moment format="MM/DD/YY h:mmA">
                  {election.electionStartDate.seconds * 1000}
                </Moment>
                -
                <Moment format="MM/DD/YY h:mmA">
                  {election.electionEndDate.seconds * 1000}
                </Moment>
              </Text>
            </Box>
          </Link>
        ))}
      </Box>
    </Box>
  );
};

export default DashboardPage;

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
  } else if (session.user.accountType === "admin") {
    const electionSnapshot = await getDocs(
      query(
        collection(firestore, "elections"),
        where("uid", "in", session.user.elections)
      )
    );
    if (electionSnapshot.empty) {
      return {
        redirect: {
          destination: "/create-election",
          permanent: false,
        },
      };
    }
    const elections = electionSnapshot.docs.map((doc) => doc.data());
    return {
      props: { elections: JSON.parse(JSON.stringify(elections)) },
    };
  }
  return {
    props: {},
  };
};
