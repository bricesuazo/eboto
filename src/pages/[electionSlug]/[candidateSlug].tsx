import {
  Container,
  Text,
  Box,
  Flex,
  Title,
  Breadcrumbs,
  Stack,
  Anchor,
  List,
} from "@mantine/core";
import type {
  Achievement,
  Affiliation,
  Candidate,
  Election,
  EventAttended,
  Partylist,
  Position,
} from "@prisma/client";
import type { GetServerSideProps, GetServerSidePropsContext } from "next";
import { getServerAuthSession } from "../../server/auth";
import { prisma } from "../../server/db";
import Image from "next/image";
import { IconUser } from "@tabler/icons-react";
import Link from "next/link";
import Head from "next/head";
import Moment from "react-moment";
import { env } from "../../env.mjs";

const CandidatePage = ({
  election,
  candidate,
}: {
  election: Election;
  candidate: Candidate & {
    credential:
      | (Credential & {
          affiliations: Affiliation[];
          achievements: Achievement[];
          eventsAttended: EventAttended[];
        })
      | null;
    position: Position;
    partylist: Partylist;
  };
}) => {
  const title = `${`${candidate.last_name}, ${candidate.first_name}${
    candidate.middle_name ? " " + candidate.middle_name : ""
  }`} – ${election.name} | eBoto Mo`;

  const imageContent = `${
    env.NEXT_PUBLIC_NODE_ENV === "production"
      ? "https://eboto-mo.com"
      : "http://localhost:3000"
  }/api/og?type=candidate&candidate_name=${encodeURIComponent(
    candidate.first_name
  )}${
    (candidate.middle_name &&
      `%20${encodeURIComponent(candidate.middle_name ?? "")}`) ??
    ""
  }%20${encodeURIComponent(
    candidate.last_name
  )}&candidate_position=${encodeURIComponent(
    candidate.position.name
  )}&candidate_img=${encodeURIComponent(candidate.image ?? "")}`;

  const metaDescription = `${candidate.first_name}${
    (candidate.middle_name && ` ${candidate.middle_name ?? ""}`) ?? ""
  } ${candidate.last_name} credential page - ${election.name} | eBoto Mo`;

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta property="og:title" content={title} />
        <meta property="og:image" content={imageContent} />
        <meta name="description" content={metaDescription} />
        <meta property="og:description" content={metaDescription} />
      </Head>

      <Container py="xl">
        <Stack>
          <Breadcrumbs w="100%">
            <Box>
              <Anchor
                component={Link}
                href={`/${election.slug}`}
                truncate
                maw={300}
              >
                {election.name}
              </Anchor>
            </Box>

            <Text truncate maw={300}>
              {`${candidate.last_name}, ${candidate.first_name}${
                candidate.middle_name ? " " + candidate.middle_name : ""
              }`}
            </Text>
          </Breadcrumbs>
          <Flex
            gap="md"
            sx={(theme) => ({
              [theme.fn.smallerThan("xs")]: {
                flexDirection: "column",
              },
            })}
          >
            <Box
              sx={(theme) => ({
                position: "sticky",
                top: 76,
                height: "100%",

                [theme.fn.smallerThan("xs")]: {
                  position: "initial",
                },
              })}
            >
              {candidate.image ? (
                <Box
                  pos="relative"
                  sx={(theme) => ({
                    width: 280,
                    aspectRatio: "1/1",

                    [theme.fn.smallerThan("sm")]: {
                      width: 200,
                      height: "auto",
                    },
                    [theme.fn.smallerThan("xs")]: {
                      width: "100%",
                      height: "auto",
                    },
                  })}
                >
                  <Image
                    src={candidate.image}
                    alt={candidate.first_name + " " + candidate.last_name}
                    fill
                    sizes="100%"
                    priority
                  />
                </Box>
              ) : (
                <Box
                  sx={(theme) => ({
                    width: 280,
                    aspectRatio: "1/1",

                    [theme.fn.smallerThan("sm")]: {
                      width: 200,
                      height: "auto",
                    },
                    [theme.fn.smallerThan("xs")]: {
                      width: "100%",
                      height: "auto",
                    },
                  })}
                >
                  <IconUser width="100%" height="100%" stroke={1.5} />
                </Box>
              )}
            </Box>

            <Box sx={{ flex: 1 }}>
              <Title order={2}>
                {`${candidate.last_name}, ${candidate.first_name}${
                  candidate.middle_name ? " " + candidate.middle_name : ""
                }`}
              </Title>
              <Text>Running for {candidate.position.name}</Text>
              <Text>{candidate.partylist.name}</Text>

              {(candidate.credential?.affiliations.length ||
                candidate.credential?.achievements.length ||
                candidate.credential?.eventsAttended.length) && (
                <Stack mt="xl" spacing="xs">
                  <Title order={3}>Credentials</Title>

                  {candidate.credential?.achievements.length ? (
                    <Box>
                      <Title order={5}>Achievements</Title>
                      <List>
                        {candidate.credential?.achievements.map(
                          (achievement) => (
                            <List.Item key={achievement.id}>
                              {achievement.name} (
                              <Moment date={achievement.year} format="YYYY" />)
                            </List.Item>
                          )
                        )}
                      </List>
                    </Box>
                  ) : null}

                  {candidate.credential?.affiliations.length ? (
                    <Box>
                      <Title order={5}>Affiliations</Title>
                      <List>
                        {candidate.credential?.affiliations.map(
                          (affiliation) => (
                            <List.Item key={affiliation.id}>
                              {affiliation.org_name} (
                              <Moment
                                format="YYYY"
                                date={affiliation.start_year}
                              />
                              -
                              <Moment
                                format="YYYY"
                                date={affiliation.end_year}
                              />
                              )
                            </List.Item>
                          )
                        )}
                      </List>
                    </Box>
                  ) : null}

                  {candidate.credential?.eventsAttended.length ? (
                    <Box>
                      <Title order={5}>Seminars/Events Attended</Title>

                      <List>
                        {candidate.credential?.eventsAttended.map(
                          (eventAttended) => (
                            <List.Item key={eventAttended.id}>
                              {eventAttended.name} (
                              <Moment date={eventAttended.year} format="YYYY" />
                              )
                            </List.Item>
                          )
                        )}
                      </List>
                    </Box>
                  ) : null}
                </Stack>
              )}
            </Box>
          </Flex>
        </Stack>
      </Container>
    </>
  );
};

export default CandidatePage;

export const getServerSideProps: GetServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  if (
    !context.query.electionSlug ||
    !context.query.candidateSlug ||
    typeof context.query.electionSlug !== "string" ||
    typeof context.query.candidateSlug !== "string"
  )
    return { notFound: true };

  const session = await getServerAuthSession(context);
  const election = await prisma.election.findFirst({
    where: {
      slug: context.query.electionSlug,
      candidates: {
        some: {
          slug: context.query.candidateSlug,
        },
      },
    },
  });

  if (!election) return { notFound: true };

  if (election.publicity === "PRIVATE") {
    if (!session)
      return { redirect: { destination: "/signin", permanent: false } };

    const commissioner = await prisma.commissioner.findFirst({
      where: {
        electionId: election.id,
        userId: session.user.id,
      },
    });

    if (!commissioner) return { notFound: true };
  } else if (election.publicity === "VOTER") {
    if (!session)
      return { redirect: { destination: "/signin", permanent: false } };

    const voter = await prisma.voter.findFirst({
      where: {
        electionId: election.id,
        userId: session.user.id,
      },
    });

    const commissioner = await prisma.commissioner.findFirst({
      where: {
        electionId: election.id,
        userId: session.user.id,
      },
    });

    if (!voter && !commissioner)
      return {
        redirect: { destination: "/signin", permanent: false },
      };
  }

  const candidate = await prisma.candidate.findFirst({
    where: {
      electionId: election.id,
      slug: context.query.candidateSlug,
    },
    include: {
      partylist: true,
      position: true,
      credential: {
        include: {
          achievements: true,
          affiliations: true,
          eventsAttended: true,
        },
      },
    },
  });

  if (!candidate) return { notFound: true };

  return {
    props: {
      election,
      candidate,
    },
  };
};
