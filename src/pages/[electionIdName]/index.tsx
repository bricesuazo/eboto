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

const ElectionPage = ({
  election,
  partylists,
  positions,
  candidates,
}: ElectionPageProps) => {
  const pageTitle = `${election.name} - Election | eBoto Mo`;
  console.table(election);
  console.table(partylists);
  console.table(positions);
  console.table(candidates);
  return (
    <>
      <Head>
        <title>{pageTitle}</title>
      </Head>
      <Box>
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

        <Box>
          <Box>
            {positions
              .sort((a, b) => a.createdAt.seconds - b.createdAt.seconds)
              .map((position) => {
                return (
                  <Box key={position.id}>
                    <Text fontSize="2xl">{position.title}</Text>
                    <Box>
                      {candidates
                        .filter(
                          (candidate) => candidate.position === position.uid
                        )
                        .map((candidate) => {
                          const linkToCandidate = `/${
                            election.electionIdName
                          }/${candidate.firstName
                            .replace(/\s/g, "")
                            .toLocaleLowerCase()}${
                            candidate.middleName &&
                            `-${candidate.middleName
                              .replace(/\s/g, "")
                              .toLocaleLowerCase()}`
                          }-${candidate.lastName
                            .replace(/\s/g, "")
                            .toLocaleLowerCase()}`;
                          return (
                            <Link href={linkToCandidate} key={candidate.id}>
                              <a>
                                <Text>{`${candidate.lastName}, ${
                                  candidate.firstName
                                }${
                                  candidate.middleName &&
                                  ` ${candidate.middleName.charAt(0)}.`
                                } (${
                                  partylists.find((partylist) => {
                                    return (
                                      partylist.uid === candidate.partylist
                                    );
                                  })?.abbreviation
                                })`}</Text>
                              </a>
                            </Link>
                          );
                        })}
                    </Box>
                  </Box>
                );
              })}
          </Box>
        </Box>
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
      positions: JSON.parse(JSON.stringify(positions)) as positionType[],
      partylists: JSON.parse(JSON.stringify(partylists)) as partylistType[],
      candidates: JSON.parse(JSON.stringify(candidates)) as candidateType[],
    },
  };
};
