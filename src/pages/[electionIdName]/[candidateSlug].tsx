import {
  AspectRatio,
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Button,
  Container,
  Flex,
  IconButton,
  ListItem,
  Stack,
  Text,
  UnorderedList,
} from "@chakra-ui/react";
import { ChevronRightIcon, ShareIcon } from "@heroicons/react/24/outline";
import { collection, getDocs, query, where } from "firebase/firestore";
import type { GetServerSideProps, GetServerSidePropsContext } from "next";
import { Session } from "next-auth";
import { getSession } from "next-auth/react";
import { FacebookShareButton } from "next-share";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import Moment from "react-moment";
import { firestore } from "../../firebase/firebase";
import {
  candidateType,
  electionType,
  partylistType,
  positionType,
} from "../../types/typings";

const CandidateCredentialPage = ({
  candidate,
  partylist,
  position,
  election,
  session,
}: {
  candidate: candidateType;
  partylist: partylistType;
  position: positionType;
  election: electionType;
  session: Session;
}) => {
  const title = `${candidate.firstName}${
    candidate.middleName && ` ${candidate.middleName}`
  } ${candidate.lastName} - ${election.name} | eBoto Mo`;

  const imageContent = `${process.env
    .NEXT_PUBLIC_BASE_URL!}/api/og?type=candidate&fullName=${encodeURIComponent(
    candidate.firstName
  )}${
    candidate.middleName && `%20${encodeURIComponent(candidate.middleName)}`
  }%20${encodeURIComponent(candidate.lastName)}&position=${encodeURIComponent(
    position.title
  )}${
    candidate.photoUrl &&
    candidate.photoUrl.length &&
    `&election=${election.uid}&candidate=${candidate.uid}`
  }`;
  const metaDescription = `${candidate.firstName}${
    candidate.middleName && ` ${candidate.middleName}`
  } ${candidate.lastName} credential page - ${election.name} | eBoto Mo`;

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
      <Container maxW="6xl" minH="3xl" paddingY={8}>
        <Breadcrumb
          spacing="8px"
          separator={<ChevronRightIcon color="gray.500" width={12} />}
          marginBottom={[4, 8]}
          fontSize={["xs", "sm", "md"]}
        >
          <BreadcrumbItem>
            <BreadcrumbLink href={`/${election.electionIdName}`}>
              {election.name}
            </BreadcrumbLink>
          </BreadcrumbItem>

          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink fontWeight="semibold">
              {candidate.firstName}
              {candidate.middleName && ` ${candidate.middleName}`}{" "}
              {candidate.lastName}
            </BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
        <Stack direction={["column", "row"]} spacing={[4, 4, 8]}>
          <AspectRatio
            position="relative"
            userSelect="none"
            pointerEvents="none"
            width={["auto", "full"]}
            height={["auto", "full"]}
            ratio={1}
            flex={[1, 3, 1]}
          >
            <Image
              src={
                candidate.photoUrl
                  ? candidate.photoUrl
                  : "/assets/images/default-profile-picture.png"
              }
              alt={`${candidate.firstName}${
                candidate.middleName && ` ${candidate.middleName}`
              } ${candidate.lastName} photo`}
              fill
              style={{ objectFit: "cover" }}
              sizes="contain"
              priority
            />
          </AspectRatio>
          <Box width="full" flex={[2, 4, 2]}>
            <Flex
              justifyContent="space-between"
              alignItems="center"
              gap={[0, 4]}
            >
              <Text fontSize={["lg", "xl", "2xl"]} fontWeight="bold">
                {`${candidate.firstName}${
                  candidate.middleName && " " + candidate.middleName
                } ${candidate.lastName} (${partylist.abbreviation})`}
              </Text>
              <FacebookShareButton
                url={`https://eboto-mo.com/${election.electionIdName}/${candidate.slug}`}
                hashtag={"#eBotoMo"}
              >
                <Flex
                  padding={[2]}
                  border="1px"
                  borderColor="gray.300"
                  columnGap={2}
                  borderRadius="md"
                  alignItems="center"
                  justifyContent="center"
                  display={["none", "flex"]}
                  _hover={{ backgroundColor: "gray.50" }}
                  transition="background-color 0.2s"
                >
                  <ShareIcon width={18} />
                  <Text display={["none", "none", "inherit"]}>Share</Text>
                </Flex>
              </FacebookShareButton>
            </Flex>
            <Text fontSize={["md", "lg"]}>Running for {position.title}</Text>
            <Box display={["inherit", "none"]}>
              <FacebookShareButton
                url={`https://eboto-mo.com/${election.electionIdName}/${candidate.slug}`}
                hashtag={"#eBotoMo"}
                style={{ width: "100%", marginTop: 4 }}
              >
                <Flex
                  padding={2}
                  border="1px"
                  borderColor="gray.300"
                  columnGap={2}
                  borderRadius="md"
                  alignItems="center"
                  justifyContent="center"
                  _hover={{ backgroundColor: "gray.50" }}
                  transition="background-color 0.2s"
                >
                  <ShareIcon width={18} />
                  <Text>Share</Text>
                </Flex>
              </FacebookShareButton>
            </Box>

            <Stack marginTop={8}>
              <Text fontSize="xl" fontWeight="bold">
                Credentials
              </Text>

              <Box>
                <Text fontWeight="bold">Achievements</Text>
                <UnorderedList>
                  {candidate.credentials.achievements.length ? (
                    candidate.credentials.achievements.map((achievement) => (
                      <ListItem key={achievement.id}>
                        {achievement.title}
                      </ListItem>
                    ))
                  ) : (
                    <ListItem>No achievements</ListItem>
                  )}
                </UnorderedList>
              </Box>
              <Box>
                <Text fontWeight="bold">Affiliations</Text>
                <UnorderedList>
                  {candidate.credentials.affiliations.length ? (
                    candidate.credentials.affiliations
                      .sort((a, b) => b.startDate.seconds - a.startDate.seconds)
                      .map((affiliation) => (
                        <ListItem key={affiliation.id}>
                          {affiliation.position} -{" "}
                          {affiliation.organizationName}{" "}
                          {affiliation.startDate && affiliation.endDate && (
                            <>
                              (
                              <Moment format="YYYY">
                                {affiliation.startDate.seconds * 1000}
                              </Moment>{" "}
                              -{" "}
                              <Moment format="YYYY">
                                {affiliation.endDate.seconds * 1000}
                              </Moment>
                              )
                            </>
                          )}
                        </ListItem>
                      ))
                  ) : (
                    <ListItem>No affiliations</ListItem>
                  )}
                </UnorderedList>
              </Box>
              <Box>
                <Text fontWeight="bold">Seminars Attended</Text>
                <UnorderedList>
                  {candidate.credentials.seminarsAttended.length ? (
                    candidate.credentials.seminarsAttended
                      .sort((a, b) => b.startDate.seconds - a.startDate.seconds)
                      .map((seminarsAttended) => (
                        <ListItem key={seminarsAttended.id}>
                          {seminarsAttended.name}{" "}
                          {seminarsAttended.startDate &&
                            seminarsAttended.endDate && (
                              <>
                                (
                                <Moment format="YYYY">
                                  {seminarsAttended.startDate.seconds * 1000}
                                </Moment>{" "}
                                -{" "}
                                <Moment format="YYYY">
                                  {seminarsAttended.endDate.seconds * 1000}
                                </Moment>
                                )
                              </>
                            )}
                        </ListItem>
                      ))
                  ) : (
                    <ListItem>No seminars attended</ListItem>
                  )}
                </UnorderedList>
              </Box>
            </Stack>
          </Box>
        </Stack>
      </Container>
    </>
  );
};

export default CandidateCredentialPage;

export const getServerSideProps: GetServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const { electionIdName, candidateSlug } = context.query;

  if (electionIdName && candidateSlug) {
    const electionSnapshot = await getDocs(
      query(
        collection(firestore, "elections"),
        where("electionIdName", "==", electionIdName)
      )
    );

    const candidateSnapshot = await getDocs(
      query(
        collection(
          firestore,
          "elections",
          electionSnapshot.docs[0].data().uid,
          "candidates"
        ),
        where("slug", "==", candidateSlug)
      )
    );
    const positionSnapshot = await getDocs(
      query(
        collection(
          firestore,
          "elections",
          electionSnapshot.docs[0].data().uid,
          "positions"
        ),
        where("uid", "==", candidateSnapshot.docs[0].data().position)
      )
    );
    const partylistSnapshot = await getDocs(
      query(
        collection(
          firestore,
          "elections",
          electionSnapshot.docs[0].data().uid,
          "partylists"
        ),
        where("uid", "==", candidateSnapshot.docs[0].data().partylist)
      )
    );

    if (!candidateSnapshot.empty) {
      return {
        props: {
          session: await getSession(context),
          election: JSON.parse(
            JSON.stringify(electionSnapshot.docs[0].data() as electionType)
          ),
          candidate: JSON.parse(
            JSON.stringify(candidateSnapshot.docs[0].data() as candidateType)
          ),
          partylist: JSON.parse(
            JSON.stringify(partylistSnapshot.docs[0].data() as partylistType)
          ),
          position: JSON.parse(
            JSON.stringify(positionSnapshot.docs[0].data() as positionType)
          ),
        },
      };
    }
  }

  return { notFound: true };
};
