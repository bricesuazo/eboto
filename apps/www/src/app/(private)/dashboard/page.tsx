import DashboardCard from "@/components/client/components/dashboard-card";
import Dashboard from "@/components/client/layout/dashboard";
import CreateElection from "@/components/client/modals/create-election";
import { auth } from "@eboto-mo/auth";
import { db } from "@eboto-mo/db";
import { Box, Container, Flex, Group, Stack, Text, Title } from "@mantine/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "eBoto Mo | Dashboard",
};

export default async function Page() {
  const session = await auth();

  if (!session) notFound();

  const electionsAsCommissioner = await db.query.commissioners.findMany({
    where: (commissioners, { eq }) => eq(commissioners.user_id, session.user.id),
    with: {
      election: true,
    },
  });

  const electionsAsVoter = await db.query.voters.findMany({
    where: (voters, { eq }) => eq(voters.user_id, session.user.id),
    with: {
      election: {
        with: {
          votes: {
            where: (votes, { eq }) => eq(votes.voter_id, session.user.id),
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
