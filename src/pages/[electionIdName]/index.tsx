import { collection, getDocs, query, where } from "firebase/firestore";
import { GetServerSideProps } from "next";
import {
  candidateType,
  electionType,
  partylistType,
  positionType,
} from "../../types/typings";
import { firestore } from "../../firebase/firebase";
import { Box, Text } from "@chakra-ui/react";
import Head from "next/head";
import Moment from "react-moment";
import Link from "next/link";

interface ElectionPageProps {
  election: electionType;
  partylists: partylistType[];
  positions: positionType[];
  candidates: candidateType[];
}

const ElectionPage = ({ election }: ElectionPageProps) => {
  const pageTitle = `${election.name} - Election | eBoto Mo`;
  return (
    <>
      <Head>
        <title>{pageTitle}</title>
      </Head>
      <Box>
        <Text fontSize="2xl">{election.name}</Text>
        <Link href={`https://eboto-mo.com/${election.electionIdName}`}>
          <a>
            <Text _hover={{ textDecoration: "underline" }}>
              eboto-mo.com/{election.electionIdName}
            </Text>
          </a>
        </Link>
        <Text>{election.about}</Text>
        {election.electionStartDate && election.electionEndDate && (
          <Text>
            <Moment format="MMMM DD, YYYY">
              {election.electionStartDate.seconds * 1000}
            </Moment>
            {" - "}
            <Moment format="MMMM DD, YYYY">
              {election.electionEndDate.seconds * 1000}
            </Moment>
          </Text>
        )}
        <Text>{election.about}</Text>
      </Box>
    </>
  );
};

export default ElectionPage;

export const getServerSideProps: GetServerSideProps = async (context) => {
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
  const positionsSnapshot = await getDocs(
    collection(firestore, "elections", electionSnapshot.docs[0].id, "positions")
  );
  const positions = positionsSnapshot.docs.map((doc) => doc.data());

  const partylistsSnapshot = await getDocs(
    collection(
      firestore,
      "elections",
      electionSnapshot.docs[0].id,
      "partylists"
    )
  );
  const partylists = partylistsSnapshot.docs.map((doc) => doc.data());

  const candidatesSnapshot = await getDocs(
    collection(
      firestore,
      "elections",
      electionSnapshot.docs[0].id,
      "candidates"
    )
  );
  const candidates = candidatesSnapshot.docs.map((doc) => doc.data());
  return {
    props: {
      election: JSON.parse(JSON.stringify(electionSnapshot.docs[0].data())),
      positions,
      partylists,
      candidates,
    },
  };
};
