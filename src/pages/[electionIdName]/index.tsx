import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { GetServerSideProps } from "next";
import {
  candidateType,
  electionType,
  partylistType,
  positionType,
} from "../../types/typings";
import { firestore } from "../../firebase/firebase";
import {
  Box,
  Button,
  Center,
  Container,
  Flex,
  Stack,
  Text,
} from "@chakra-ui/react";
import Head from "next/head";
import Moment from "react-moment";
import Link from "next/link";
import isElectionOngoing from "../../utils/isElectionOngoing";
import Image from "next/image";
import { useState } from "react";

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
  const [seeMore, setSeeMore] = useState(false);

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
      </Head>
      <Container
        maxW="8xl"
        textAlign="center"
        paddingX={[2, 4, 8, 16]}
        paddingY={16}
      >
        <Text fontSize="3xl" fontWeight="bold">
          {election.name}
        </Text>
        <Text>
          <Moment format="MMMM DD, YYYY, h:mmA">
            {election.electionStartDate.seconds * 1000}
          </Moment>
          {" - "}
          <Moment format="MMMM DD, YYYY, h:mmA">
            {election.electionEndDate.seconds * 1000}
          </Moment>
        </Text>
        {election.about && (
          <Container
            maxW="2xl"
            fontWeight="normal"
            onClick={() => setSeeMore((prev) => !prev)}
            marginTop={4}
            width="full"
            cursor="pointer"
          >
            <Text fontWeight="bold">About</Text>
            <Text>
              {!seeMore
                ? election.about?.slice(0, 56) + "... See more"
                : election.about + " See less"}
            </Text>
          </Container>
        )}
        <Box marginTop={4}>
          {!isElectionOngoing(
            election.electionStartDate,
            election.electionEndDate
          ) ? (
            <Button disabled>Voting is not available</Button>
          ) : (
            <Link href={`/${election.electionIdName}/vote`}>
              <Button>Vote</Button>
            </Link>
          )}
        </Box>

        <Stack marginTop={8} spacing={8}>
          {positions.map((position) => {
            return (
              <Stack key={position.id} alignItems="center">
                <Text fontSize="2xl" fontWeight="bold">
                  {position.title}
                </Text>
                <Flex flexWrap="wrap" gap={4} justifyContent="center">
                  {candidates
                    .filter((candidate) => candidate.position === position.uid)
                    .map((candidate) => {
                      return (
                        <Link
                          href={`/${election.electionIdName}/${candidate.slug}`}
                          key={candidate.id}
                        >
                          <Center
                            padding={4}
                            border="2px"
                            borderColor="gray.100"
                            borderRadius="lg"
                            width="12rem"
                            height="16rem"
                            flexDirection="column"
                            justifyContent="flex-start"
                            cursor="pointer"
                            transition="all 0.2s"
                            _hover={{ borderColor: "gray.800" }}
                            userSelect="none"
                          >
                            <Box
                              position="relative"
                              width="10rem"
                              height="10rem"
                              pointerEvents="none"
                            >
                              <Image
                                src={
                                  candidate.photoUrl
                                    ? candidate.photoUrl
                                    : "/assets/images/default-profile-picture.png"
                                }
                                alt={`${candidate.firstName}${
                                  candidate.middleName &&
                                  ` ${candidate.middleName}`
                                } ${candidate.lastName} photo`}
                                fill
                                style={{ objectFit: "cover" }}
                              />
                            </Box>
                            <Text>{`${candidate.lastName}, ${
                              candidate.firstName
                            }${
                              candidate.middleName &&
                              ` ${candidate.middleName.charAt(0)}.`
                            } (${
                              partylists.find((partylist) => {
                                return partylist.uid === candidate.partylist;
                              })?.abbreviation
                            })`}</Text>
                          </Center>
                        </Link>
                      );
                    })}
                </Flex>
              </Stack>
            );
          })}
        </Stack>
      </Container>
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
  const positions = positionsSnapshot.docs.map((doc) => doc.data());

  const partylistsSnapshot = await getDocs(
    query(
      collection(
        firestore,
        "elections",
        electionSnapshot.docs[0].id,
        "partylists"
      ),
      orderBy("createdAt", "asc")
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
