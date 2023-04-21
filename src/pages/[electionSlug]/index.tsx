import {
  Stack,
  Box,
  UnstyledButton,
  Button,
  Container,
  Text,
  Title,
  Group,
  Skeleton,
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
import Balancer from "react-wrap-balancer";
import Head from "next/head";

const ElectionPage = ({
  election,
  hasVoted,
  isOngoing,
}: {
  election: Election;
  hasVoted: boolean;
  isOngoing: boolean;
}) => {
  const title = `${election.name} | eBoto Mo`;
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
    <>
      <Head>
        <title>{title}</title>
      </Head>

      <Container py="xl">
        {positions.isLoading ? (
          <Stack align="center" spacing={12}>
            <Stack spacing={8} align="center">
              <Group position="center" mb={4}>
                <Skeleton w={92} h={92} />
              </Group>
              <Skeleton w={228} h={28} />
              <Skeleton w={248} h={16} />
              <Skeleton w={200} h={16} />
              <Skeleton w={172} h={32} radius="lg" />
            </Stack>

            {[...(Array(8) as unknown as number[])].map((_, i) => (
              <Stack key={i} spacing={8} align="center" w="100%">
                <Skeleton w={128} h={28} radius="lg" />

                <Group position="center" w="100%" spacing={12}>
                  {[...(Array(2) as unknown as number[])].map((_, i) => (
                    <Skeleton
                      key={i}
                      sx={(theme) => ({
                        width: 200,
                        height: 192,
                        borderRadius: theme.radius.md,

                        [theme.fn.smallerThan("xs")]: {
                          width: "100%",
                          height: 128,
                        },
                      })}
                    />
                  ))}
                </Group>
              </Stack>
            ))}
          </Stack>
        ) : positions.isError ? (
          <Text>Error: {positions.error.message}</Text>
        ) : !positions.data ? (
          <Text>Not found</Text>
        ) : (
          <Stack align="center">
            <Box>
              <Group position="center" mb={8}>
                {election.logo ? (
                  <Image
                    src={election.logo}
                    alt="Logo"
                    width={92}
                    height={92}
                    priority
                  />
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
                {hasVoted || election.end_date < new Date() ? (
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

            <Stack spacing="lg">
              {positions.data.map((position) => (
                <Stack spacing={4} key={position.id}>
                  <Title order={3} weight={600} align="center" lineClamp={2}>
                    <Balancer>{position.name}</Balancer>
                  </Title>

                  <Group position="center" spacing="sm">
                    {position.candidate.length === 0 ? (
                      <Text>No candidates</Text>
                    ) : (
                      position.candidate.map((candidate) => (
                        <UnstyledButton
                          component={Link}
                          href={`/${election?.slug || ""}/${candidate.slug}`}
                          sx={(theme) => ({
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            width: 200,
                            height: 192,
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
                              height: 128,
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
                                priority
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
                            {candidate.last_name} ({candidate.partylist.acronym}
                            )
                          </Text>
                        </UnstyledButton>
                      ))
                    )}
                  </Group>
                </Stack>
              ))}
            </Stack>
          </Stack>
        )}
      </Container>
    </>
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
  const election = await prisma.election.findUnique({
    where: {
      slug: context.query.electionSlug,
    },
  });

  if (!election) return { notFound: true };

  const isOngoing = isElectionOngoing({ election, withTime: true });

  if (election.publicity === "PRIVATE") {
    if (!session)
      return {
        redirect: {
          destination: `/signin?callbackUrl=https://eboto-mo.com/${election.slug}`,
          permanent: false,
        },
      };

    const commissioner = await prisma.commissioner.findFirst({
      where: {
        electionId: election.id,
        userId: session.user.id,
      },
    });

    if (!commissioner) return { notFound: true };

    const vote = await prisma.vote.findFirst({
      where: {
        voterId: commissioner.userId,
        electionId: election.id,
      },
    });

    if (!vote)
      return {
        props: {
          isOngoing,
          hasVoted: false,
          election: JSON.parse(JSON.stringify(election)) as Election,
        },
      };

    return {
      props: {
        isOngoing,
        hasVoted: true,
        election: JSON.parse(JSON.stringify(election)) as Election,
      },
    };
  } else if (election.publicity === "VOTER") {
    if (!session)
      return {
        redirect: {
          destination: `/signin?callbackUrl=https://eboto-mo.com/${election.slug}`,
          permanent: false,
        },
      };

    const vote = await prisma.vote.findFirst({
      where: {
        voterId: session.user.id,
        electionId: election.id,
      },
    });

    return {
      props: {
        isOngoing,
        hasVoted: !!vote,
        election: JSON.parse(JSON.stringify(election)) as Election,
      },
    };
  } else if (election.publicity === "PUBLIC") {
    if (!session)
      return {
        props: {
          isOngoing: true,
          hasVoted: true,
          election: JSON.parse(JSON.stringify(election)) as Election,
        },
      };

    const vote = await prisma.vote.findFirst({
      where: {
        voterId: session.user.id,
        electionId: election.id,
      },
    });

    return {
      props: {
        isOngoing,
        hasVoted: !!vote,
        election: JSON.parse(JSON.stringify(election)) as Election,
      },
    };
  }

  return {
    props: {
      isOngoing,
      hasVoted: true,
      election: JSON.parse(JSON.stringify(election)) as Election,
    },
  };
};
