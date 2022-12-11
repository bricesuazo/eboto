import {
  Box,
  Button,
  Center,
  Container,
  Flex,
  Stack,
  Text,
} from "@chakra-ui/react";
import { ShareIcon } from "@heroicons/react/24/outline";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import moment from "moment";
import { GetServerSideProps } from "next";
import { Session } from "next-auth";
import { getSession } from "next-auth/react";
import { FacebookShareButton } from "next-share";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import Moment from "react-moment";
import { firestore } from "../../firebase/firebase";
import {
  candidateType,
  electionType,
  partylistType,
  positionType,
} from "../../types/typings";
import isElectionOngoing from "../../utils/isElectionOngoing";

interface ElectionPageProps {
  election: electionType;
  partylists: partylistType[];
  positions: positionType[];
  candidates: candidateType[];
  session: Session;
}

const ElectionPage = ({
  election,
  partylists,
  positions,
  candidates,
  session,
}: ElectionPageProps) => {
  const [seeMore, setSeeMore] = useState(false);

  const title = `${election.name} | eBoto Mo`;
  const imageContent = `${process.env
    .NEXT_PUBLIC_BASE_URL!}/api/og?type=election&electionName=${
    election.name
  }&electionStartDate=${moment(
    election.electionStartDate.seconds * 1000
  ).format("MMMM D, YYYY hA")}&electionEndDate=${moment(
    election.electionEndDate.seconds * 1000
  ).format("MMMM D, YYYY hA")}${
    election.logoUrl &&
    election.logoUrl.length &&
    `&electionLogoUrl=${election.logoUrl}`
  }`;
  const metaDescription = `See details about ${election.name} | eBoto Mo`;

  const ErrorPage = ({ children }: { children: React.ReactNode }) => {
    return (
      <>
        <HeadElementCandidate />
        <Container
          maxW="8xl"
          minH="2xl"
          paddingY={8}
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          <Flex flexDirection="column" alignItems="center">
            {children}
          </Flex>
        </Container>
      </>
    );
  };
  const HeadElementCandidate = () => {
    return (
      <Head>
        <title>{title}</title>
        <meta property="og:image" content={imageContent} />
        <meta property="og:title" content={title} />
        <meta name="description" content={metaDescription} />
        <meta property="og:description" content={metaDescription} />
      </Head>
    );
  };
  if (election.publicity !== "public") {
    if (!session) {
      return (
        <ErrorPage>
          <Text fontSize={["lg", "xl", "2xl"]} fontWeight="bold">
            This page is not available.
          </Text>
          <Link href="/signin">
            <Button>Sign in to continue</Button>
          </Link>
        </ErrorPage>
      );
    }
    switch (session.user.accountType) {
      case "admin":
        if (!session.user.elections.includes(election.uid)) {
          return (
            <ErrorPage>
              <Text fontSize={["lg", "xl", "2xl"]} fontWeight="bold">
                Unauthorized (admin)
              </Text>
              <Link href="/dashboard">
                <Button>Go to dashboard</Button>
              </Link>
            </ErrorPage>
          );
        }
        break;
      case "voter":
        if (
          election.publicity === "private" ||
          session.user.election !== election.uid
        ) {
          return (
            <ErrorPage>
              <Text fontSize={["lg", "xl", "2xl"]} fontWeight="bold">
                Unauthorized (voter)
              </Text>
              <Link href="/signin">
                <Button>Go to your assigned election</Button>
              </Link>
            </ErrorPage>
          );
        }
        break;
    }
  }

  return (
    <>
      <HeadElementCandidate />
      <Container
        maxW="8xl"
        textAlign="center"
        paddingX={[2, 4, 8, 16]}
        paddingY={16}
        minHeight="75vh"
        alignItems="center"
      >
        {election.publicity === "private" ? (
          <Center>
            <Text>The election is set to private</Text>
          </Center>
        ) : (
          <>
            <Text fontSize="3xl" fontWeight="bold">
              {election.name}
            </Text>
            <Text>
              <Moment format="MMMM DD, YYYY, hA">
                {election.electionStartDate.seconds * 1000}
              </Moment>
              {" - "}
              <Moment format="MMMM DD, YYYY, hA">
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
              <FacebookShareButton
                url={`https://eboto-mo.com/${election.electionIdName}`}
                hashtag={`#${election.name.replace(/\s/g, "")}`}
              >
                <Button leftIcon={<ShareIcon width={18} />} variant="outline">
                  Share
                </Button>
              </FacebookShareButton>
            </Box>
            <Box marginTop={4}>
              {!session ? (
                <Link href="/signin">
                  <Button>Sign in to vote</Button>
                </Link>
              ) : election.publicity === "public" &&
                session.user.accountType === "voter" &&
                session.user.election !== election.uid ? (
                <Text>You can&apos;t vote on this election.</Text>
              ) : session.user.accountType === "voter" &&
                session.user.hasVoted ? (
                <Link href={`/${election.electionIdName}/realtime`}>
                  <Button>Go to realtime voting count update</Button>
                </Link>
              ) : !isElectionOngoing(
                  election.electionStartDate,
                  election.electionEndDate
                ) ? (
                <Button disabled>Voting is not available</Button>
              ) : (
                <>
                  {session.user.accountType === "voter" &&
                    !session.user.hasVoted && (
                      <Link href={`/${election.electionIdName}/vote`}>
                        <Button>Vote</Button>
                      </Link>
                    )}
                </>
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
                        .filter(
                          (candidate) => candidate.position === position.uid
                        )
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
                                  borderRadius="md"
                                  overflow="hidden"
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
                                    sizes="contain"
                                    priority
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
                                    return (
                                      partylist.uid === candidate.partylist
                                    );
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
          </>
        )}
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
      election: JSON.parse(JSON.stringify(electionSnapshot.docs[0].data())),
      positions: JSON.parse(
        JSON.stringify(positionsSnapshot.docs.map((doc) => doc.data()))
      ) as positionType[],
      partylists: JSON.parse(
        JSON.stringify(partylistsSnapshot.docs.map((doc) => doc.data()))
      ) as partylistType[],
      candidates: JSON.parse(
        JSON.stringify(candidatesSnapshot.docs.map((doc) => doc.data()))
      ) as candidateType[],
      session: await getSession(context),
    },
  };
};
