"use client";

import CreateElection from "@/components/client/modals/create-election";
import DashboardCard from "@/components/server/components/dashboard-card";
import type { Commissioner, Election, Vote, Voter } from "@eboto-mo/db/schema";
import {
  Box,
  Container, // Flex,
  Group,
  Skeleton,
  Stack,
  Text,
  Title,
} from "@mantine/core";

export default function DashboardPageClient({
  commissioners,
  voters,
}: {
  commissioners: (Commissioner & { election: Election })[];
  voters: (Voter & {
    election: Election & { votes: Vote[] };
  })[];
}) {
  return (
    <Container p="md">
      <Stack gap="lg">
        <Box>
          <Group align="center" justify="space-between">
            <Title
              order={2}
              // style={(theme) => ({
              //   [theme.fn.smallerThan("xs")]: {
              //     fontSize: theme.fontSizes.xl,
              //   },
              // })}
            >
              My elections
            </Title>

            <CreateElection />
          </Group>
          <Text
            size="xs"
            color="grayText"
            style={(theme) => ({
              marginBottom: theme.spacing.xs,
            })}
          >
            You can manage the elections below.
          </Text>
          <Group>
            {!commissioners ? (
              Array(3).map((_, i) => (
                <Skeleton
                  key={i}
                  width={250}
                  height={332}
                  radius="md"
                  // style={(theme) => ({
                  //   [theme.fn.smallerThan("xs")]: { width: "100%" },
                  // })}
                />
              ))
            ) : commissioners.length === 0 ? (
              <Box h={72}>
                <Text>No elections found</Text>
              </Box>
            ) : (
              commissioners.map((commissioner) => (
                <DashboardCard
                  election={commissioner.election}
                  key={commissioner.id}
                  type="manage"
                />
              ))
            )}
          </Group>
        </Box>

        <Box>
          <Title
            order={2}
            // style={(theme) => ({
            //   [theme.fn.smallerThan("xs")]: {
            //     fontSize: theme.fontSizes.xl,
            //   },
            // })}
          >
            My elections I can vote in
          </Title>
          <Text
            size="xs"
            color="grayText"
            style={(theme) => ({
              marginBottom: theme.spacing.xs,
            })}
          >
            You can vote in the elections below. You can only vote once per
            election.
          </Text>

          <Group>
            {!voters ? (
              Array(3).map((_, i) => (
                <Skeleton
                  key={i}
                  width={250}
                  height={352}
                  radius="md"
                  // style={(theme) => ({
                  //   [theme.fn.smallerThan("xs")]: { width: "100%" },
                  // })}
                />
              ))
            ) : voters.length === 0 ? (
              <Box h={72}>
                <Text>No vote elections found</Text>
              </Box>
            ) : (
              voters.map((voter) => (
                <DashboardCard
                  election={voter.election}
                  key={voter.id}
                  type="vote"
                  // vote={election.vote}
                />
              ))
            )}
          </Group>
        </Box>
      </Stack>
    </Container>
  );
}
