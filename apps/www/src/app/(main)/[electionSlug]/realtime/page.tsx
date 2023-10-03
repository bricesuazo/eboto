import type { Metadata } from "next";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import ScrollToTopButton from "@/components/client/components/scroll-to-top";
import { api } from "@/trpc/server";
import {
  Box,
  Center,
  Container,
  Flex,
  Group,
  SimpleGrid,
  Stack,
  Table,
  TableCaption,
  TableTbody,
  TableTd,
  TableTh,
  TableThead,
  TableTr,
  Text,
  Title,
} from "@mantine/core";
import { IconFingerprint } from "@tabler/icons-react";
import moment from "moment";
import Balancer from "react-wrap-balancer";

import { auth } from "@eboto-mo/auth";
import { isElectionEnded, isElectionOngoing } from "@eboto-mo/constants";
import { db } from "@eboto-mo/db";

export async function generateMetadata({
  params: { electionSlug },
}: {
  params: { electionSlug: string };
}): Promise<Metadata> {
  const election = await db.query.elections.findFirst({
    where: (election, { eq, and, isNull }) =>
      and(eq(election.slug, electionSlug), isNull(election.deleted_at)),
  });

  if (!election) return notFound();

  return {
    title: election.name + " - Realtime Result",
    description: `See realtime result of ${election.name} | eBoto Mo`,
    openGraph: {
      title: election.name,
      description: `See realtime result of ${election.name} | eBoto Mo`,
      images: [
        {
          url: `${
            process.env.NODE_ENV === "production"
              ? "https://eboto-mo.com"
              : "http://localhost:3000"
          }/api/og?type=election&election_name=${encodeURIComponent(
            election.name,
          )}&election_logo=${encodeURIComponent(
            election.logo ?? "",
          )}&election_date=${encodeURIComponent(
            moment(election.start_date).format("MMMM D, YYYY hA") +
              " - " +
              moment(election.end_date).format("MMMM D, YYYY hA"),
          )}`,
          width: 1200,
          height: 630,
          alt: election.name,
        },
      ],
    },
  };
}

export default async function RelatimePage({
  params: { electionSlug },
}: {
  params: { electionSlug: string };
}) {
  const session = await auth();
  const election = await db.query.elections.findFirst({
    where: (election, { eq, and, isNull }) =>
      and(eq(election.slug, electionSlug), isNull(election.deleted_at)),
  });
  const positions = await api.election.getElectionRealtime.query(electionSlug);

  if (!election) notFound();

  if (election.publicity === "PRIVATE") {
    if (!session)
      redirect(
        `/sign-in?callbackUrl=https://eboto-mo.com/${election.slug}/realtime`,
      );

    const isCommissioner = await db.query.commissioners.findFirst({
      where: (commissioner, { eq, and, isNull }) =>
        and(
          eq(commissioner.election_id, election.id),
          eq(commissioner.user_id, session.user.id),
          isNull(commissioner.deleted_at),
        ),
      with: {
        user: true,
      },
    });

    if (!isCommissioner) notFound();

    const isVoter = await db.query.voters.findFirst({
      where: (voter, { eq, and, isNull }) =>
        and(
          eq(voter.election_id, election.id),
          eq(voter.email, isCommissioner.user.email),
          isNull(voter.deleted_at),
        ),
    });

    const vote = await db.query.votes.findFirst({
      where: (vote, { eq, and }) =>
        and(
          eq(vote.election_id, election.id),
          eq(vote.voter_id, isCommissioner.user_id),
        ),
    });

    if (isVoter && !vote) redirect(`/${election.slug}`);
  } else if (election.publicity === "VOTER") {
    if (!session)
      redirect(
        `/sign-in?callbackUrl=https://eboto-mo.com/${election.slug}/realtime`,
      );

    const vote = await db.query.votes.findFirst({
      where: (votes, { eq, and }) =>
        and(
          eq(votes.election_id, election.id),
          eq(votes.voter_id, session.user.id),
        ),
    });

    const isVoter = await db.query.voters.findFirst({
      where: (voter, { eq, and, isNull }) =>
        and(
          eq(voter.election_id, election.id),
          eq(voter.email, session.user.email ?? ""),
          isNull(voter.deleted_at),
        ),
    });

    const isCommissioner = await db.query.commissioners.findFirst({
      where: (commissioner, { eq, and, isNull }) =>
        and(
          eq(commissioner.election_id, election.id),
          eq(commissioner.user_id, session.user.id),
          isNull(commissioner.deleted_at),
        ),
    });

    if (!isVoter && !isCommissioner) notFound();

    if (
      (!vote && isVoter) ??
      (!isElectionOngoing({ election }) && isVoter && !vote)
    )
      redirect(`/${election.slug}`);
  }

  const isEnded = isElectionEnded({ election });
  const isOngoing = isElectionOngoing({ election });

  return (
    <>
      <ScrollToTopButton />
      <Container py="xl" size="md">
        <Stack gap="xl">
          <Center>
            <Box>
              <Group justify="center" mb={8}>
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
              <Title order={2} style={{ lineClamp: 2 }} ta="center">
                {election.name} (@{election.slug})
              </Title>
              <Text ta="center">
                {moment(election.start_date).format("MMMM D, YYYY hA")}
                {" - "}
                {moment(election.end_date).format("MMMM D, YYYY hA")}
              </Text>

              {!isEnded ? (
                <Text ta="center" size="xs" c="dimmed">
                  <Balancer>
                    Realtime result as of{" "}
                    {moment(new Date()).format("MMMM Do YYYY, h:mm:ss A")}
                  </Balancer>
                </Text>
              ) : (
                <Text ta="center" tw="bold">
                  Official result as of{" "}
                  {moment(new Date()).format("MMMM Do YYYY, h:mm:ss A")}
                </Text>
              )}
            </Box>
          </Center>

          <Stack gap="xl">
            <SimpleGrid
              cols={{
                base: 1,
                xs: 2,
                sm: 3,
              }}
              spacing={{
                base: "md",
                xs: "sm",
              }}
            >
              {positions.map((position) => (
                <Table
                  key={position.id}
                  striped
                  highlightOnHover
                  withTableBorder
                  withColumnBorders
                  captionSide="bottom"
                  h="fit-content"
                >
                  {!isEnded && (
                    <TableCaption>
                      As of{" "}
                      {moment(new Date()).format("MMMM Do YYYY, h:mm:ss A")}
                    </TableCaption>
                  )}
                  <TableThead>
                    <TableTr>
                      <TableTh>
                        <Text lineClamp={2} fw="bold">
                          {position.name}
                        </Text>
                      </TableTh>
                    </TableTr>
                  </TableThead>

                  <TableTbody>
                    {position.candidates
                      .sort((a, b) => b.vote - a.vote)
                      .map((candidate) => (
                        <TableTr key={candidate.id}>
                          <TableTd>
                            <Flex justify="space-between" align="center">
                              <Text lineClamp={2}>
                                {isOngoing
                                  ? candidate.first_name
                                  : `${candidate.last_name}, ${
                                      candidate.first_name
                                    }
                            ${
                              candidate.middle_name
                                ? " " + candidate.middle_name.charAt(0) + "."
                                : ""
                            } (${candidate.partylist.acronym})`}
                              </Text>
                              <Text>{candidate.vote}</Text>
                            </Flex>
                          </TableTd>
                        </TableTr>
                      ))}
                    <TableTr>
                      <TableTd>
                        <Flex justify="space-between" align="center">
                          <Text>Abstain</Text>
                          <Text>{position.votes}</Text>
                        </Flex>
                      </TableTd>
                    </TableTr>
                  </TableTbody>
                </Table>
              ))}
            </SimpleGrid>
            {/* <Stack gap="sm">
              <Title order={3} ta="center">
                Voter Stats
              </Title>
              {voterFieldsStats.isLoading ? (
                <Center>
                  <Loader size="sm" />
                </Center>
              ) : !voterFieldsStats.data ||
                voterFieldsStats.data.length === 0 ? (
                <Text align="center">No voter stats</Text>
              ) : (
                <SimpleGrid
                  cols={2}
                  style={{
                    alignItems: "start",
                  }}
                  breakpoints={[
                    {
                      maxWidth: "md",
                      cols: 1,
                    },
                  ]}
                >
                  {voterFieldsStats.data.map((voterFieldStat) => (
                    <Table
                      key={voterFieldStat.fieldName}
                      striped
                      highlightOnHover
                      withBorder
                      withColumnBorders
                    >
                      <thead>
                        <tr>
                          <th>{voterFieldStat.fieldName}</th>
                          <th>Voted</th>
                          <th>Voter (Accepted)</th>
                          <th>Voter (Invited)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {voterFieldStat.fields.map((field) => (
                          <tr key={field.fieldValue}>
                            <td>{field.fieldValue}</td>
                            <td>{field.voteCount}</td>
                            <td>{field.allCountAccepted}</td>
                            <td>{field.allCountInvited}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  ))}
                </SimpleGrid>
              )}
            </Stack> */}
          </Stack>
        </Stack>
      </Container>
    </>
  );
}
