import {
  Box,
  Container,
  Grid,
  Spinner,
  Table,
  TableCaption,
  TableContainer,
  Tbody,
  Td,
  Text,
  Tfoot,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import type {
  GetServerSideProps,
  GetServerSidePropsContext,
  NextPage,
} from "next";
import Head from "next/head";
import React from "react";
import { useFirestoreCollectionData } from "reactfire";
import { firestore } from "../../firebase/firebase";
import { candidateType, electionType, positionType } from "../../types/typings";

interface RealtimePageProps {
  election: electionType;
  positions: positionType[];
  candidates: candidateType[];
}
const RealtimePage = ({
  election,
  positions,
  candidates,
}: RealtimePageProps) => {
  const pageTitle = `${election.name} - Realtime | eBoto Mo`;
  const { status: positionsLoading, data: positionsCount } =
    useFirestoreCollectionData(
      collection(firestore, "elections", election.uid, "positions")
    );
  const { status: candidatesLoading, data: candidatesCount } =
    useFirestoreCollectionData(
      collection(firestore, "elections", election.uid, "candidates")
    );

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
      </Head>

      <Box padding={4}>
        <Text>{election.name}</Text>
        <Box>
          <TableContainer>
            <Grid
              templateColumns={[
                "repeat(1, 1fr)",
                "repeat(3, 1fr)",
                "repeat(4, 1fr)",
              ]}
              gap={4}
              alignItems="flex-start"
            >
              {positions.map((position) => (
                <Table key={position.id} variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th textAlign="center">{position.title}</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {candidates
                      .filter(
                        (candidate) => candidate.position === position.uid
                      )
                      .map((candidate) => (
                        <Tr key={candidate.id}>
                          <Td>
                            <Box display="flex" justifyContent="space-between">
                              <Text>{candidate.lastName}</Text>
                              <Text>
                                {positionsLoading === "loading" ? (
                                  <Spinner size="sm" />
                                ) : (
                                  candidatesCount.find(
                                    (candidateCount) =>
                                      candidateCount.uid === candidate.uid &&
                                      candidate.position === position.uid
                                  )?.votingCount
                                )}
                              </Text>
                            </Box>
                          </Td>
                        </Tr>
                      ))}
                  </Tbody>
                </Table>
              ))}
            </Grid>
          </TableContainer>
        </Box>
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
  const positionsSnapshot = await getDocs(
    query(
      collection(
        firestore,
        "elections",
        electionSnapshot.docs[0].id,
        "positions"
      ),
      orderBy("createdAt", "asc")
    )
  );
  const positions = positionsSnapshot.docs.map((doc) => doc.data());
  const candidatesSnapshot = await getDocs(
    collection(
      firestore,
      "elections",
      electionSnapshot.docs[0].id,
      "candidates"
    )
  );
  const candidates = candidatesSnapshot.docs.map((doc) => doc.data());

  if (electionSnapshot.empty || positionsSnapshot.empty) {
    return {
      notFound: true,
    };
  }
  return {
    props: {
      election: JSON.parse(
        JSON.stringify(electionSnapshot.docs[0].data())
      ) as electionType,
      positions: JSON.parse(JSON.stringify(positions)) as positionType[],
      candidates: JSON.parse(JSON.stringify(candidates)) as candidateType[],
    },
  };
};
