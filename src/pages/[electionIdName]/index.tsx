import {
  Box,
  Button,
  Center,
  Container,
  Flex,
  Stack,
  Text,
} from "@chakra-ui/react";
import { FingerPrintIcon, ShareIcon } from "@heroicons/react/24/outline";
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
import { getHourByNumber } from "../../utils/getHourByNumber";

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
    .NEXT_PUBLIC_BASE_URL!}/api/og?type=election&electionName=${encodeURIComponent(
    election.name
  )}${
    election.logoUrl && election.logoUrl.length
      ? `&electionLogoUrl=${encodeURIComponent(election.logoUrl)}`
      : ""
  }&electionStartDate=${encodeURIComponent(
    moment(election.electionStartDate.seconds * 1000).format("MMMM D, YYYY hA")
  )}&electionEndDate=${encodeURIComponent(
    moment(election.electionEndDate.seconds * 1000).format("MMMM D, YYYY hA")
  )}`;
  const metaDescription = `See details about ${election.name} | eBoto Mo`;

  const ErrorPage = ({ children }: { children: React.ReactNode }) => {
    return (
      <>
        <HeadElementElection />
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
  const HeadElementElection = () => {
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
            ⛔ This page is not available.
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
                🚫 Unauthorized (admin)
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
                🚫 Unauthorized (voter)
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
      <HeadElementElection />
      <Container
        maxW="6xl"
        textAlign="center"
        paddingY={16}
        minHeight="xl"
        alignItems="center"
      >
        {election.publicity === "private" ? (
          <Stack alignItems="center" spacing={4}>
            <Text fontSize="2xl" fontWeight="bold">
              🔒 The election is set to private
            </Text>
            <Text fontSize="sm" maxWidth="md">
              If you are a voter, please contact the admin or the COMELEC.
            </Text>
            <Text fontSize="sm" maxWidth="md">
              If you are an admin, please check the election publicity, election
              dates, and voting hours in the settings on the dashboard page.
            </Text>
          </Stack>
        ) : (
          <>
            {election.logoUrl && election.logoUrl.length && (
              <Box
                position="relative"
                width={[24, 32]}
                height={[24, 32]}
                marginX="auto"
              >
                <Image
                  src={election.logoUrl}
                  alt={`${election.name} logo`}
                  fill
                  sizes="cover"
                  style={{ objectFit: "cover", objectPosition: "center" }}
                />
              </Box>
            )}
            <Text fontSize={["xl", "2xl", "3xl"]} fontWeight="bold">
              {election.name}
            </Text>
            <Text fontSize={["xs", "sm", "initial"]}>
              <Moment format="MMMM DD, YYYY, hA">
                {election.electionStartDate.seconds * 1000}
              </Moment>
              {" - "}
              <Moment format="MMMM DD, YYYY, hA">
                {election.electionEndDate.seconds * 1000}
              </Moment>
            </Text>
            <Text fontSize={["xs", "sm", "initial"]}>
              Voting hours: {getHourByNumber(election.votingStartHour)} -{" "}
              {getHourByNumber(election.votingEndHour)} (
              {election.votingEndHour - election.votingStartHour < 0
                ? election.votingStartHour - election.votingEndHour
                : election.votingEndHour - election.votingStartHour}{" "}
              {election.votingEndHour - election.votingStartHour > 1
                ? "hours"
                : "hour"}
              )
            </Text>
            <Box marginTop={4}>
              <FacebookShareButton
                url={`https://eboto-mo.com/${election.electionIdName}`}
                hashtag={`#${election.name.replace(/\s/g, "")}`}
              >
                <Flex
                  paddingX={[3, 4]}
                  paddingY={[1.5, 2]}
                  border="1px"
                  borderColor="gray.300"
                  columnGap={2}
                  borderRadius="md"
                  alignItems="center"
                  justifyContent="center"
                  _hover={{ backgroundColor: "gray.50" }}
                  transition="background-color 0.2s"
                >
                  <ShareIcon width={16} />
                  <Text fontWeight="semibold" fontSize={["xs", "sm"]}>
                    Share
                  </Text>
                </Flex>
              </FacebookShareButton>
            </Box>
            {election.about && (
              <Container
                maxW="2xl"
                fontWeight="normal"
                onClick={() => setSeeMore((prev) => !prev)}
                marginTop={4}
                width="full"
                cursor="pointer"
              >
                <Text fontWeight="bold" fontSize={["xs", "sm"]}>
                  About
                </Text>
                <Text fontSize={["xs", "sm"]}>
                  {!seeMore
                    ? election.about?.slice(0, 56) + "... See more"
                    : election.about + " See less"}
                </Text>
              </Container>
            )}
            <Box marginTop={4}>
              {!session ? (
                <Link href="/signin">
                  <Button fontSize={["sm", "initial"]}>Sign in to vote</Button>
                </Link>
              ) : election.publicity === "public" &&
                session.user.accountType === "voter" &&
                session.user.election !== election.uid ? (
                <Text fontSize={["sm", "initial"]}>
                  You can&apos;t vote on this election.
                </Text>
              ) : session.user.accountType === "voter" &&
                session.user.hasVoted ? (
                <Link href={`/${election.electionIdName}/realtime`}>
                  <Button fontSize={["sm", "initial"]}>
                    Go to realtime voting count update
                  </Button>
                </Link>
              ) : !isElectionOngoing(election) ? (
                <Button disabled fontSize={["sm", "initial"]}>
                  Voting is not available
                </Button>
              ) : (
                <>
                  {session.user.accountType === "voter" &&
                    !session.user.hasVoted && (
                      <Link href={`/${election.electionIdName}/vote`}>
                        <Button leftIcon={<FingerPrintIcon width={18} />}>
                          Vote Now
                        </Button>
                      </Link>
                    )}
                </>
              )}
            </Box>
            <Stack marginTop={8} spacing={8}>
              {positions.map((position) => {
                return (
                  <Stack key={position.id} alignItems="center">
                    <Text fontSize={["lg", "xl", "2xl"]} fontWeight="bold">
                      {position.title}
                    </Text>
                    <Flex flexWrap="wrap" gap={[2, 4]} justifyContent="center">
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
                                width={["9rem", "12rem"]}
                                height={["13rem", "16rem"]}
                                flexDirection="column"
                                justifyContent="flex-start"
                                cursor="pointer"
                                transition="all 0.2s"
                                _hover={{ borderColor: "gray.800" }}
                                userSelect="none"
                                gap={2}
                              >
                                <Box
                                  position="relative"
                                  width={["7.5rem", "10rem"]}
                                  height={["7.5rem", "10rem"]}
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
                                <Text
                                  fontSize={["sm", "sm", "inherit"]}
                                  noOfLines={2}
                                >{`${candidate.lastName}, ${
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
