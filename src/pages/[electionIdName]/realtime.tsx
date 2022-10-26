import {
  Box,
  Container,
  SimpleGrid,
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

      <Container maxW="2xl">
        <Box marginBottom={4}>
          <Text fontSize="2xl" fontWeight="bold" textAlign="center">
            {election.name}
          </Text>
          <Text textAlign="center">Realtime Count Update</Text>
        </Box>
        <Box>
          <TableContainer>
            <SimpleGrid
              columns={[
                Math.ceil(positions.length / positions.length),
                Math.ceil(positions.length / 2),
              ]}
              spacing={4}
              alignItems="flex-start"
            >
              {positions.map((position) => (
                <Box
                  border="1px"
                  borderColor="gray.700"
                  padding={2}
                  borderRadius={4}
                >
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
                        .sort((a, b) => b.votingCount - a.votingCount)
                        .map((candidate, index) => (
                          <Tr key={candidate.id}>
                            <Td
                            // borderBottom={
                            //   index !== candidates.length - 1 ? 0 : 1
                            // }
                            >
                              <Box
                                display="flex"
                                justifyContent="space-between"
                              >
                                <Text>{candidate.lastName}</Text>
                                <Text>
                                  {positionsLoading === "loading" ||
                                  !candidatesCount ? (
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

                      <Tr>
                        <Td>
                          <Box display="flex" justifyContent="space-between">
                            <Text>Undecided</Text>
                            <Text>
                              {positionsLoading === "loading" ||
                              !positionsCount ? (
                                <Spinner size="sm" />
                              ) : (
                                positionsCount.find(
                                  (positionCount) =>
                                    positionCount.uid === position.uid
                                )?.undecidedVotingCount
                              )}
                            </Text>
                          </Box>
                        </Td>
                      </Tr>
                    </Tbody>
                  </Table>
                </Box>
              ))}
            </SimpleGrid>
          </TableContainer>
        </Box>
      </Container>
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
