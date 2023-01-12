import {
  Box,
  Container,
  SimpleGrid,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import type { GetServerSideProps, GetServerSidePropsContext } from "next";
import { Session } from "next-auth";
import { getSession } from "next-auth/react";
import Head from "next/head";
import { useFirestoreCollectionData } from "reactfire";
import { firestore } from "../../firebase/firebase";
import { candidateType, electionType, positionType } from "../../types/typings";
import isElectionOngoing from "../../utils/isElectionOngoing";

interface RealtimePageProps {
  election: electionType;
  positions: positionType[];
  candidates: candidateType[];
  session: Session;
}
const RealtimePage = ({
  election,
  positions,
  candidates,
  session,
}: RealtimePageProps) => {
  const pageTitle = `${election.name} - Realtime | eBoto Mo`;
  const { status: positionsLoading, data: positionsCount } =
    useFirestoreCollectionData(
      collection(firestore, "elections", election.uid, "positions")
    );
  const { data: candidatesCount } = useFirestoreCollectionData(
    collection(firestore, "elections", election.uid, "candidates")
  );

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
      </Head>

      <Container maxW="6xl" minHeight="2xl" paddingY={16}>
        <Box marginBottom={4}>
          <Text fontSize="2xl" fontWeight="bold" textAlign="center">
            {election.name}
          </Text>
          <Text textAlign="center">Realtime Count Update</Text>
        </Box>

        <SimpleGrid columns={[1, 2, 3]} spacing={4} alignItems="flex-start">
          {positions.map((position) => (
            <Box
              key={position.id}
              border="1px"
              borderColor="gray.200"
              padding={2}
              borderRadius={4}
            >
              <Table key={position.id} variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th
                      textAlign="center"
                      noOfLines={1}
                      overflowWrap="break-word"
                      width="full"
                    >
                      {position.title}
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {candidates
                    .filter((candidate) => candidate.position === position.uid)
                    .sort((a, b) => b.votingCount - a.votingCount)
                    .map((candidate, index) => (
                      <Tr
                        key={candidate.id}
                        _hover={{ backgroundColor: "gray.50" }}
                      >
                        <Td borderColor="gray.100">
                          <Box display="flex" justifyContent="space-between">
                            <Text noOfLines={1}>
                              {session.user.accountType === "voter" &&
                              isElectionOngoing(election)
                                ? `Candidate ${index + 1}`
                                : `${candidate.lastName}, ${
                                    candidate.firstName
                                  }${
                                    candidate.middleName &&
                                    ` ${candidate.middleName.charAt(0)}.`
                                  }`}
                            </Text>

                            {positionsLoading === "loading" ||
                            !candidatesCount ? (
                              <Spinner size="sm" />
                            ) : (
                              <Text>
                                {
                                  candidatesCount.find(
                                    (candidateCount) =>
                                      candidateCount.uid === candidate.uid &&
                                      candidate.position === position.uid
                                  )?.votingCount
                                }
                              </Text>
                            )}
                          </Box>
                        </Td>
                      </Tr>
                    ))}

                  <Tr _hover={{ backgroundColor: "gray.50" }}>
                    <Td borderColor="gray.100">
                      <Box display="flex" justifyContent="space-between">
                        <Text>Undecided</Text>

                        {positionsLoading === "loading" || !positionsCount ? (
                          <Spinner size="sm" />
                        ) : (
                          <Text>
                            {
                              positionsCount.find(
                                (positionCount) =>
                                  positionCount.uid === position.uid
                              )?.undecidedVotingCount
                            }
                          </Text>
                        )}
                      </Box>
                    </Td>
                  </Tr>
                </Tbody>
              </Table>
            </Box>
          ))}
        </SimpleGrid>
      </Container>
    </>
  );
};

export default RealtimePage;

export const getServerSideProps: GetServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const session = await getSession(context);
  if (!session || typeof context.query.electionIdName !== "string") {
    return {
      redirect: {
        destination: "/signin",
        permanent: false,
      },
    };
  }

  switch (session.user.accountType) {
    case "voter":
      if (!session.user.hasVoted) {
        return {
          redirect: {
            destination: `/${context.query.electionIdName}`,
            permanent: false,
          },
        };
      }
      break;
  }

  const electionSnapshot = await getDocs(
    query(
      collection(firestore, "elections"),
      where("electionIdName", "==", context.query.electionIdName)
    )
  );
  if (electionSnapshot.docs[0].data().publicity === "private") {
    return {
      redirect: {
        destination: `/${electionSnapshot.docs[0].data().electionIdName}`,
        permanent: false,
      },
    };
  }
  switch (session.user.accountType) {
    case "admin":
      if (!session.user.elections.includes(electionSnapshot.docs[0].id)) {
        return {
          redirect: {
            destination: "/dashboard",
            permanent: false,
          },
        };
      }
      break;
    case "voter":
      if (session.user.election !== electionSnapshot.docs[0].id) {
        return {
          redirect: {
            destination: `${electionSnapshot.docs[0].data().electionIdName}}`,
            permanent: false,
          },
        };
      }
  }
  const positionsSnapshot = await getDocs(
    query(
      collection(
        firestore,
        "elections",
        electionSnapshot.docs[0].id,
        "positions"
      ),
      orderBy("order")
    )
  );
  const candidatesSnapshot = await getDocs(
    collection(
      firestore,
      "elections",
      electionSnapshot.docs[0].id,
      "candidates"
    )
  );

  return {
    props: {
      election: JSON.parse(
        JSON.stringify(electionSnapshot.docs[0].data())
      ) as electionType,
      positions: JSON.parse(
        JSON.stringify(positionsSnapshot.docs.map((doc) => doc.data()))
      ) as positionType[],
      candidates: JSON.parse(
        JSON.stringify(candidatesSnapshot.docs.map((doc) => doc.data()))
      ) as candidateType[],
      session,
    },
  };
};
