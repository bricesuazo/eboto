import {
  Container,
  Text,
  Table,
  Flex,
  SimpleGrid,
  Title,
  Center,
  Stack,
  Box,
  Group,
  Loader,
} from "@mantine/core";
import type { Election } from "@prisma/client";
import { IconFingerprint } from "@tabler/icons-react";
import type { GetServerSideProps, GetServerSidePropsContext } from "next";
import Image from "next/image";
import Moment from "react-moment";
import { getServerAuthSession } from "../../server/auth";
import { prisma } from "../../server/db";
import { api } from "../../utils/api";
import { convertNumberToHour } from "../../utils/convertNumberToHour";
import Balancer from "react-wrap-balancer";
import Head from "next/head";
import { env } from "../../env.mjs";
import { isElectionOngoing } from "../../utils/isElectionOngoing";

const RealtimePage = ({
  election,
  isOngoing,
}: {
  election: Election;
  isOngoing: boolean;
}) => {
  const title = `${election.name} – Realtime | eBoto Mo`;
  const positions = api.election.getElectionRealtime.useQuery(election.id, {
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval:
      env.NEXT_PUBLIC_NODE_ENV === "production" ? 1000 : undefined,
  });

  if (positions.isLoading)
    return (
      <Center h="100%">
        <Loader size="lg" />
      </Center>
    );
  if (positions.isError) return <div>Error: {positions.error.message}</div>;

  if (!positions.data) return <div>No data</div>;
  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <Container py="xl">
        <Stack spacing="xl">
          <Center>
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
              <Text align="center" size="xs" color="dimmed">
                <Balancer>
                  Realtime result as of{" "}
                  <Moment date={new Date()} format="MMMM Do YYYY, h:mm:ss a" />
                </Balancer>
              </Text>
            </Box>
          </Center>
          <SimpleGrid
            cols={3}
            breakpoints={[
              { maxWidth: "md", cols: 2, spacing: "md" },
              { maxWidth: "xs", cols: 1, spacing: "sm" },
            ]}
          >
            {positions.data.map((position) => (
              <Table
                key={position.id}
                striped
                highlightOnHover
                withBorder
                captionSide="bottom"
                h="fit-content"
              >
                <caption>
                  As of{" "}
                  <Moment date={new Date()} format="MMMM Do YYYY, h:mm:ss a" />
                </caption>
                <thead>
                  <tr>
                    <th>
                      <Text lineClamp={2}>{position.name}</Text>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {position.candidate
                    .sort((a, b) => b.vote.length - a.vote.length)
                    .map((candidate, i) => (
                      <tr key={candidate.id}>
                        <td>
                          <Flex justify="space-between" align="center">
                            <Text lineClamp={2}>
                              {isOngoing
                                ? `Candidate ${i + 1}`
                                : `${candidate.last_name}, ${
                                    candidate.first_name
                                  }
                            ${
                              candidate.middle_name
                                ? " " + candidate.middle_name.charAt(0) + "."
                                : ""
                            } (${candidate.partylist.acronym})`}
                            </Text>
                            <Text>{candidate.vote.length}</Text>
                          </Flex>
                        </td>
                      </tr>
                    ))}
                  <tr>
                    <td>
                      <Flex justify="space-between">
                        <Text>Abstain</Text>
                        <Text>{position.vote.length}</Text>
                      </Flex>
                    </td>
                  </tr>
                </tbody>
              </Table>
            ))}
          </SimpleGrid>
        </Stack>
      </Container>
    </>
  );
};

export default RealtimePage;

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

  if (election.publicity === "PRIVATE") {
    if (!session)
      return {
        redirect: {
          destination: `/signin?callbackUrl=https://eboto-mo.com/${election.slug}/realtime`,
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

    const isVoter = await prisma.voter.findFirst({
      where: {
        userId: commissioner.userId,
        electionId: election.id,
      },
    });

    const vote = await prisma.vote.findFirst({
      where: {
        voterId: commissioner.userId,
        electionId: election.id,
      },
    });

    if (isVoter && !vote)
      return {
        redirect: {
          destination: `/${election.slug}`,
          permanent: false,
        },
      };
  } else if (election.publicity === "VOTER") {
    if (!session)
      return {
        redirect: {
          destination: `/signin?callbackUrl=https://eboto-mo.com/${election.slug}/realtime`,
          permanent: false,
        },
      };

    const vote = await prisma.vote.findFirst({
      where: {
        voterId: session.user.id,
        electionId: election.id,
      },
    });

    const commissioner = await prisma.commissioner.findFirst({
      where: {
        electionId: election.id,
        userId: session.user.id,
      },
    });

    if (
      !vote &&
      isElectionOngoing({ election, withTime: true }) &&
      !commissioner
    )
      return {
        redirect: { destination: `/${election.slug}`, permanent: false },
      };
  }

  return {
    props: {
      election,
      isOngoing: isElectionOngoing({ election, withTime: true }),
    },
  };
};
