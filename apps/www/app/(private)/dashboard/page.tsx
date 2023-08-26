import DashboardCard from "@/components/client/components/dashboard-card";
import Dashboard from "@/components/client/layout/dashboard";
import CreateElection from "@/components/client/modals/create-election";
import { auth } from "@clerk/nextjs";
import { db } from "@eboto-mo/db";
import { Box, Container, Flex, Group, Stack, Text, Title } from "@mantine/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "eBoto Mo | Dashboard",
};

export default async function Page() {
  const { userId } = auth();

  if (!userId) notFound();

  const electionsAsCommissioner = await db.query.commissioners.findMany({
    where: (commissioners, { eq }) => eq(commissioners.user_id, userId),
    with: {
      election: true,
    },
  });

  const electionsAsVoter = await db.query.voters.findMany({
    where: (voters, { eq }) => eq(voters.user_id, userId),
    with: {
      election: {
        with: {
          votes: {
            where: (votes, { eq }) => eq(votes.voter_id, userId),
          },
        },
      },
    },
  });

  return (
    <Dashboard>
      <Container size="md" my="md">
        <Stack gap="lg">
          <Box>
            <Flex align="center" justify="space-between">
              <Title order={2} visibleFrom="xs">
                My elections
              </Title>
              <Title order={4} hiddenFrom="xs">
                My elections
              </Title>

              <CreateElection />
            </Flex>
            <Text size="xs" c="grayText" mb="md" hiddenFrom="xs">
              You can manage the elections below.
            </Text>
            <Text size="sm" c="grayText" mb="md" visibleFrom="xs">
              You can manage the elections below.
            </Text>
            <Group>
              {electionsAsCommissioner.length === 0 ? (
                <Box h={72}>
                  <Text>No elections found</Text>
                </Box>
              ) : (
                electionsAsCommissioner.map((commissioner) => (
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
            <Title order={2} visibleFrom="xs">
              My elections I can vote in
            </Title>
            <Title order={4} hiddenFrom="xs">
              My elections I can vote in
            </Title>

            <Text size="xs" c="grayText" mb="sm" hiddenFrom="xs">
              You can vote in the elections below. You can only vote once per
              election.
            </Text>
            <Text size="sm" c="grayText" mb="md" visibleFrom="xs">
              You can vote in the elections below. You can only vote once per
              election.
            </Text>

            <Group>
              {electionsAsVoter.length === 0 ? (
                <Box h={72}>
                  <Text>No vote elections found</Text>
                </Box>
              ) : (
                electionsAsVoter.map((voter) => (
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
