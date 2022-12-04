import type { GetServerSideProps, GetServerSidePropsContext } from "next";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { firestore } from "../../firebase/firebase";
import {
  candidateType,
  electionType,
  partylistType,
  positionType,
} from "../../types/typings";
import {
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
import Image from "next/image";
import { ChevronRightIcon, ShareIcon } from "@heroicons/react/24/outline";
import { FacebookShareButton } from "next-share";
import Moment from "react-moment";
import Head from "next/head";

const CandidateCredentialPage = ({
  candidate,
  partylist,
  position,
  election,
}: {
  candidate: candidateType;
  partylist: partylistType;
  position: positionType;
  election: electionType;
}) => {
  const title = `${candidate.firstName}${
    candidate.middleName && ` ${candidate.middleName}`
  } ${candidate.lastName} - ${election.name} | eBoto Mo`;
  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <Container maxW="8xl" minH="2xl" paddingY={8}>
        <Breadcrumb
          spacing="8px"
          separator={<ChevronRightIcon color="gray.500" width={12} />}
          marginBottom={8}
        >
          <BreadcrumbItem>
            <BreadcrumbLink href={`/${election.electionIdName}`}>
              {election.name}
            </BreadcrumbLink>
          </BreadcrumbItem>

          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink>
              {candidate.firstName}
              {candidate.middleName && ` ${candidate.middleName}`}{" "}
              {candidate.lastName}
            </BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
        <Stack direction={["column", "row"]} spacing={8}>
          <Box
            position="relative"
            minWidth={["xs", "2xs", "sm"]}
            minHeight={["xs", "2xs", "sm"]}
            width={["xs", "2xs", "sm"]}
            height={["xs", "2xs", "sm"]}
            userSelect="none"
            pointerEvents="none"
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
              sizes="contain"
              priority
            />
          </Box>
          <Box width="full">
            <Flex justifyContent="space-between" alignItems="center">
              <Text fontSize="2xl" fontWeight="bold">
                {`${candidate.firstName}${
                  candidate.middleName && " " + candidate.middleName
                } ${candidate.lastName} (${partylist.abbreviation})`}
              </Text>
              <FacebookShareButton
                url={`https://eboto-mo.com/${election.electionIdName}/${candidate.slug}`}
                quote={
                  "next-share is a social share buttons for your next React apps."
                }
                hashtag={"#eBotoMo"}
              >
                <IconButton
                  aria-label="Share"
                  icon={<ShareIcon width={18} />}
                  variant="outline"
                />
              </FacebookShareButton>
            </Flex>
            <Text>Running for {position.title}</Text>
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
