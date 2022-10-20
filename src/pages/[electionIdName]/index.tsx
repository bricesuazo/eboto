import { collection, getDocs, query, where } from "firebase/firestore";
import { GetServerSideProps } from "next";
import { electionType } from "../../types/typings";
import { firestore } from "../../firebase/firebase";
import { Box, Text } from "@chakra-ui/react";
import Head from "next/head";
import Moment from "react-moment";

const ElectionPage = ({ election }: { election: electionType }) => {
  const pageTitle = `${election.name} - Election | eBoto Mo`;
  return (
    <>
      <Head>
        <title>{pageTitle}</title>
      </Head>
      <Box>
        <Text fontSize="2xl">{election.name}</Text>
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
  const electionQuery = query(
    collection(firestore, "elections"),
    where("electionIdName", "==", context.query.electionIdName)
  );
  const electionSnapshot = await getDocs(electionQuery);
  if (electionSnapshot.empty) {
    return {
      notFound: true,
    };
  }
  return {
    props: {
      election: JSON.parse(JSON.stringify(electionSnapshot.docs[0].data())),
    },
  };
};
