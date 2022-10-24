import { Box, Text } from "@chakra-ui/react";
import { collection, getDocs, query, where } from "firebase/firestore";
import type {
  GetServerSideProps,
  GetServerSidePropsContext,
  NextPage,
} from "next";
import Head from "next/head";
import React from "react";
import { useFirestoreCollectionData } from "reactfire";
import { firestore } from "../../firebase/firebase";
import { electionType } from "../../types/typings";

interface RealtimePageProps {
  election: electionType;
}
const RealtimePage = ({ election }: RealtimePageProps) => {
  const pageTitle = `${election.name} - Realtime | eBoto Mo`;
  const { status: positionsLoading, data: positions } =
    useFirestoreCollectionData(
      collection(firestore, "elections", election.uid, "positions")
    );
  const { status: candidatesLoading, data: candidates } =
    useFirestoreCollectionData(
      collection(firestore, "elections", election.uid, "candidates")
    );

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
      </Head>

      <Box>
        <Text>{election.name}</Text>
      </Box>
    </>
  );
};

export default RealtimePage;

export const getServerSideProps: GetServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const electionSnapshot = await getDocs(
    query(
      collection(firestore, "elections"),
      where("electionIdName", "==", context.query.electionIdName)
    )
  );
  if (electionSnapshot.empty) {
    return {
      notFound: true,
    };
  }
  return {
    props: {
      election: JSON.parse(
        JSON.stringify(electionSnapshot.docs[0].data())
      ) as electionType,
    },
  };
};
