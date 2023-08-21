import VoteForm from "@/components/client/components/vote-form";
import { api } from "@/trpc/server";
import { isElectionOngoing } from "@/utils";
import { auth } from "@clerk/nextjs";
import { db } from "@eboto-mo/db";
import { Box, Container, Stack, Text, Title } from "@mantine/core";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Balancer from "react-wrap-balancer";

export async function generateMetadata({
  params: { electionSlug },
}: {
  params: { electionSlug: string };
}): Promise<Metadata> {
  const election = await db.query.elections.findFirst({
    where: (election, { eq }) => eq(election.slug, electionSlug),
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
  const { userId } = auth();

  if (!userId)
    redirect(`/sign-in?callbackUrl=https://eboto-mo.com/${electionSlug}/vote`);

  const election = await db.query.elections.findFirst({
    where: (election, { eq }) => eq(election.slug, electionSlug),
  });

  if (!election) notFound();

  //   if (!isElectionOngoing({ election })) redirect(`/${election.slug}`);

  //   if (election.publicity === "PRIVATE") {
  //     const commissioner = await db.query.commissioners.findFirst({
  //       where: (commissioners, { eq, and }) =>
  //         and(
  //           eq(commissioners.user_id, userId),
  //           eq(commissioners.election_id, election.id),
  //         ),
  //     });

  //     if (!commissioner) notFound();

  //     const isVoter = await db.query.voters.findFirst({
  //       where: (voters, { eq, and }) =>
  //         and(eq(voters.user_id, userId), eq(voters.election_id, election.id)),
  //     });

  //     if (!isVoter) redirect(`/${election.slug}/realtime`);
  //   } else if (
  //     election.publicity === "VOTER" ||
  //     election.publicity === "PUBLIC"
  //   ) {
  //     const vote = await db.query.votes.findFirst({
  //       where: (votes, { eq, and }) =>
  //         and(eq(votes.voter_id, userId), eq(votes.election_id, election.id)),
  //     });

  //     const isCommissioner = await db.query.commissioners.findFirst({
  //       where: (commissioners, { eq, and }) =>
  //         and(
  //           eq(commissioners.user_id, userId),
  //           eq(commissioners.election_id, election.id),
  //         ),
  //     });

  //     const isVoter = await db.query.voters.findFirst({
  //       where: (voters, { eq, and }) =>
  //         and(eq(voters.user_id, userId), eq(voters.election_id, election.id)),
  //     });

  //     if (vote ?? (isCommissioner && !isVoter) ?? !isVoter)
  //       redirect(`/${election.slug}/realtime`);
  //   }

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
        </Box>
        <VoteForm positions={positions} />
      </Stack>
    </Container>
  );
}
