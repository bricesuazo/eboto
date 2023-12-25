import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import VoteForm from "@/components/client/components/vote-form";
import { api } from "@/trpc/server";
import { Box, Container, Stack, Text, Title } from "@mantine/core";
import moment from "moment";
import Balancer from "react-wrap-balancer";

import { auth } from "@eboto/auth";
import { isElectionOngoing, parseHourTo12HourFormat } from "@eboto/constants";
import { db } from "@eboto/db";

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
    title: `${election.name} – Vote`,
  };
}

export default async function VotePage({
  params: { electionSlug },
}: {
  params: { electionSlug: string };
}) {
  const session = await auth();

  if (!session)
    redirect(`/sign-in?callbackUrl=https://eboto-mo.com/${electionSlug}/vote`);

  const election = await db.query.elections.findFirst({
    where: (election, { eq, and, isNull }) =>
      and(eq(election.slug, electionSlug), isNull(election.deleted_at)),
    with: {
      voter_fields: true,
    },
  });

  if (!election) notFound();

  if (!isElectionOngoing({ election })) redirect(`/${election.slug}`);

  const isVoter = await db.query.voters.findFirst({
    where: (voter, { eq, and, isNull }) =>
      and(
        eq(voter.email, session.user.email ?? ""),
        eq(voter.election_id, election.id),
        isNull(voter.deleted_at),
      ),
  });

  if (!isVoter || (election.voter_fields.length && !isVoter?.field))
    redirect(`/${election.slug}`);

  const hasVoted = await db.query.votes.findFirst({
    where: (votes, { eq, and }) =>
      and(
        eq(votes.voter_id, isVoter?.id ?? ""),
        eq(votes.election_id, election.id),
      ),
  });

  if (hasVoted) redirect(`/${election.slug}/realtime`);

  if (election.publicity === "PRIVATE") {
    const commissioner = await db.query.commissioners.findFirst({
      where: (commissioner, { eq, and, isNull }) =>
        and(
          eq(commissioner.user_id, session.user.id),
          eq(commissioner.election_id, election.id),
          isNull(commissioner.deleted_at),
        ),
    });

    if (!commissioner) notFound();

    if (!isVoter) redirect(`/${election.slug}/realtime`);
  } else if (
    election.publicity === "VOTER" ||
    election.publicity === "PUBLIC"
  ) {
    const vote = await db.query.votes.findFirst({
      where: (votes, { eq, and }) =>
        and(
          eq(votes.voter_id, session.user.id),
          eq(votes.election_id, election.id),
        ),
    });

    const isCommissioner = await db.query.commissioners.findFirst({
      where: (commissioner, { eq, and }) =>
        and(
          eq(commissioner.user_id, session.user.id),
          eq(commissioner.election_id, election.id),
        ),
    });

    if (vote ?? (isCommissioner && !isVoter) ?? !isVoter)
      redirect(`/${election.slug}/realtime`);
  }

  const positions = await api.election.getElectionVoting.query(election.id);

  return (
    <Container py="xl" size="md">
      <Stack pos="relative">
        <Box>
          <Title ta="center">
            <Balancer>Cast your vote for {election.name}</Balancer>
          </Title>
          <Text ta="center">
            <Balancer>Select your candidates for each position.</Balancer>
          </Text>
          <Text ta="center">
            <Balancer>
              {moment(election.start_date).local().format("MMMM DD, YYYY")}
              {" - "}
              {moment(election.end_date).local().format("MMMM DD, YYYY")}
            </Balancer>
          </Text>
          <Text ta="center">
            Voting hours:{" "}
            {election.voting_hour_start === 0 && election.voting_hour_end === 24
              ? "Whole day"
              : parseHourTo12HourFormat(election.voting_hour_start) +
                " - " +
                parseHourTo12HourFormat(election.voting_hour_end)}
          </Text>
        </Box>
        <VoteForm election={election} positions={positions} />
      </Stack>
    </Container>
  );
}
