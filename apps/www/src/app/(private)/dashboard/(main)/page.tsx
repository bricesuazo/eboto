import type { Metadata } from "next";
import { redirect } from "next/navigation";
import DashboardCard from "@/components/client/components/dashboard-card";
import Dashboard from "@/components/client/layout/dashboard";
import CreateElection from "@/components/client/modals/create-election";
import { Box, Container, Flex, Group, Stack, Text, Title } from "@mantine/core";

import { auth } from "@eboto/auth";
import { db } from "@eboto/db";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "eBoto | Dashboard",
};

export default async function Page() {
  const session = await auth();

  if (!session) redirect("/sign-in");

  const electionsThatICanManage = await db.query.elections.findMany({
    where: (elections, { and, isNull }) => and(isNull(elections.deleted_at)),
    with: {
      commissioners: {
        where: (commissioners, { eq }) =>
          eq(commissioners.user_id, session.user.id),
      },
    },
  });

  const electionsAsCommissioner = await db.query.commissioners.findMany({
    where: (commissioners, { eq, and, inArray }) =>
      and(
        eq(commissioners.user_id, session.user.id),
        electionsThatICanManage.length
          ? inArray(
              commissioners.election_id,
              electionsThatICanManage.map((election) => election.id),
            )
          : undefined,
      ),
    with: {
      election: true,
    },
  });

  const electionsThatICanVoteIn = await db.query.elections.findMany({
    where: (elections, { and, lt, gte, isNull, ne }) =>
      and(
        isNull(elections.deleted_at),
        ne(elections.publicity, "PRIVATE"),
        lt(elections.start_date, new Date()),
        gte(elections.end_date, new Date()),
        // eq(elections.voter_domain, session.user.email?.split("@")[1] ?? ""),
      ),
    with: {
      voters: {
        where: (voters, { eq, and, isNull }) =>
          and(
            eq(voters.email, session.user.email ?? ""),
            isNull(voters.deleted_at),
          ),
        limit: 1,
      },
    },
  });

  const voter = electionsThatICanVoteIn.find(
    (election) => election.voters.length > 0,
  )?.voters[0];

  const electionsAsVoter = await db.query.voters.findMany({
    where: (voters, { eq, ne, and, inArray, isNull }) =>
      and(
        isNull(voters.deleted_at),
        eq(voters.email, session.user.email ?? ""),
        electionsThatICanVoteIn.length
          ? inArray(
              voters.election_id,
              electionsThatICanVoteIn.map((election) => election.id),
            )
          : ne(voters.email, session.user.email ?? ""),
      ),
    with: {
      election: {
        with: {
          votes: {
            where: (votes, { eq }) => eq(votes.voter_id, voter?.id ?? ""),
          },
        },
      },
    },
  });

  return (
    <Dashboard>
      <Container size="md" my="md">
        <Stack gap="xl">
          <Box hiddenFrom="xs">
            <CreateElection style={{ width: "100%" }} />
          </Box>
          <Box>
            <Flex align="center" justify="space-between">
              <Title order={2}>My elections</Title>

              <Box visibleFrom="xs">
                <CreateElection />
              </Box>
            </Flex>
            <Text size="sm" c="grayText" mb="md">
              You can manage the elections below.
            </Text>
            <Group>
              {electionsAsCommissioner.length === 0 ? (
                <Box h={72}>
                  <Text>No elections found</Text>
                </Box>
              ) : (
                electionsAsCommissioner
                  .filter((commissioner) => !commissioner.election.deleted_at)
                  .map((commissioner) => (
                    <DashboardCard
                      key={commissioner.id}
                      election={commissioner.election}
                      type="manage"
                    />
                  ))
              )}
            </Group>
          </Box>

          <Box>
            <Title order={2}>My elections I can vote in</Title>

            <Text size="sm" c="grayText" mb="sm">
              You can vote in the elections below. You can only vote once per
              election.
            </Text>

            <Group>
              {electionsAsVoter.length === 0 ? (
                <Box h={72}>
                  <Text>No vote elections found</Text>
                </Box>
              ) : (
                electionsAsVoter
                  .filter((voter) => !voter.election.deleted_at)
                  .map((voter) => (
                    <DashboardCard
                      key={voter.id}
                      election={voter.election}
                      type="vote"
                      hasVoted={voter.election.votes.length > 0}
                    />
                  ))
              )}
            </Group>
          </Box>
        </Stack>
      </Container>
    </Dashboard>
  );
}
