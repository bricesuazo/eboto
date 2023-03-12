import {
  Stack,
  Box,
  UnstyledButton,
  Button,
  Container,
  Text,
  Title,
  Group,
} from "@mantine/core";
import type { Election } from "@prisma/client";
import { IconClock, IconFingerprint, IconUser } from "@tabler/icons-react";
import type { GetServerSideProps, GetServerSidePropsContext } from "next";
import Image from "next/image";
import Link from "next/link";
import Moment from "react-moment";
import { getServerAuthSession } from "../../server/auth";
import { prisma } from "../../server/db";
import { api } from "../../utils/api";
import { convertNumberToHour } from "../../utils/convertNumberToHour";
import { isElectionOngoing } from "../../utils/isElectionOngoing";

const ElectionPage = ({
  election,
  hasVoted,
  isOngoing,
}: {
  election: Election;
  hasVoted: boolean;
  isOngoing: boolean;
}) => {
  const positions = api.election.getElectionVotingPageData.useQuery(
    election.id,
    {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      retry: false,
    }
  );

  return (
    <Container py="xl">
      {positions.isLoading ? (
        <Text>Loading...</Text>
      ) : positions.isError ? (
        <Text>Error: {positions.error.message}</Text>
      ) : !positions.data ? (
        <Text>Not found</Text>
      ) : (
        <Stack align="center">
          <Box w="100%">
            <Group position="center" mb={8}>
              {election.logo ? (
                <Image src={election.logo} alt="Logo" width={92} height={92} />
              ) : (
                <IconFingerprint size={92} style={{ padding: 8 }} />
              )}
            </Group>

            <Title order={2} lineClamp={2} align="center">
              {election.name} (@{election.slug})
            </Title>

            <Text align="center">
              <Moment format="MMMM DD, YYYY" date={election.start_date} />
              {" - "}
              <Moment format="MMMM DD, YYYY" date={election.end_date} />
            </Text>
            <Text align="center">
              Open from {convertNumberToHour(election.voting_start)} to{" "}
              {convertNumberToHour(election.voting_end)}
            </Text>

            <Group position="center" mt={8}>
              {hasVoted ? (
                <Button
                  radius="xl"
                  size="md"
                  component={Link}
                  leftIcon={<IconClock />}
                  href={`/${election.slug}/realtime`}
                >
                  Realtime count
                </Button>
              ) : !isOngoing ? (
                <Text color="red">Voting is not yet open</Text>
              ) : (
                <Button
                  radius="xl"
                  size="md"
                  leftIcon={<IconFingerprint />}
                  component={Link}
                  href={`/${election.slug}/vote`}
                >
                  Vote now!
                </Button>
              )}
            </Group>
          </Box>

          <Stack>
            {positions.data.map((position) => (
              <Stack spacing={4} key={position.id}>
                <Title order={3} weight={600} align="center" truncate>
                  {position.name}
                </Title>

                <Group position="center" spacing="sm">
                  {position.candidate.map((candidate) => (
                    <UnstyledButton
                      component={Link}
                      href={`/${election?.slug || ""}/${candidate.slug}`}
                      sx={(theme) => ({
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 200,
                        padding: theme.spacing.xs,
                        borderRadius: theme.radius.md,
                        backgroundColor:
                          theme.colorScheme === "dark"
                            ? theme.colors.dark[6]
                            : theme.colors.gray[0],
                        transition: "background-color 0.2s ease",
                        "&:hover": {
                          backgroundColor:
                            theme.colorScheme === "dark"
                              ? theme.colors.dark[5]
                              : theme.colors.gray[1],
                        },

                        [theme.fn.smallerThan("xs")]: {
                          width: "100%",
                          flexDirection: "row",
                          justifyContent: "flex-start",
                          columnGap: theme.spacing.xs,
                        },
                      })}
                      key={candidate.id}
                    >
                      <Box>
                        {candidate.image ? (
                          <Image
                            src={candidate.image}
                            alt="Candidate's image"
                            width={92}
                            height={92}
                            style={{
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <IconUser
                            style={{ width: 92, height: 92, padding: 8 }}
                          />
                        )}
                      </Box>

                      <Text
                        lineClamp={2}
                        sx={(theme) => ({
                          textAlign: "center",
                          [theme.fn.smallerThan("xs")]: {
                            textAlign: "left",
                          },
                        })}
                      >
                        {candidate.first_name}{" "}
                        {candidate.middle_name
                          ? candidate.middle_name + " "
                          : ""}
                        {candidate.last_name} ({candidate.partylist.acronym})
                      </Text>
                    </UnstyledButton>
                  ))}
                </Group>
              </Stack>
            ))}
          </Stack>
        </Stack>
      )}
    </Container>
  );
};

export default ElectionPage;

export const getServerSideProps: GetServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  if (
    !context.query.electionSlug ||
    typeof context.query.electionSlug !== "string"
  )
    return { notFound: true };

  const session = await getServerAuthSession(context);
  const election = await prisma.election.findFirst({
    where: {
      slug: context.query.electionSlug,
    },
  });

  if (!election) return { notFound: true };

  const isOngoing = isElectionOngoing(election);

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

    return {
      props: {
        isOngoing: true,
        hasVoted: true,
        election,
      },
    };
  } else if (election.publicity === "VOTER") {
    if (!session)
      return { redirect: { destination: "/signin", permanent: false } };

    const vote = await prisma.vote.findFirst({
      where: {
        voterId: session.user.id,
        electionId: election.id,
      },
    });

    if (vote) {
      return {
        props: {
          isOngoing,
          hasVoted: true,
          election,
        },
      };
    } else {
      return {
        props: {
          isOngoing,
          hasVoted: false,
          election,
        },
      };
    }
  } else if (election.publicity === "PUBLIC") {
    if (!session)
      return {
        props: {
          isOngoing,
          hasVoted: true,
          election,
        },
      };

    const vote = await prisma.vote.findFirst({
      where: {
        voterId: session.user.id,
        electionId: election.id,
      },
    });

    if (vote) {
      return {
        props: {
          isOngoing,
          hasVoted: true,
          election,
        },
      };
    } else {
      return {
        props: {
          isOngoing,
          hasVoted: false,
          election,
        },
      };
    }
  }

  return {
    props: {
      isOngoing,
      hasVoted: true,
      election,
    },
  };
};
