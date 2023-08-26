import CreatePosition from "@/components/client/modals/create-position";
import DeletePosition from "@/components/client/modals/delete-position";
import EditPosition from "@/components/client/modals/edit-position";
import classes from "@/styles/Position.module.css";
import { db } from "@eboto-mo/db";
import { Box, Flex, Group, Stack, Text } from "@mantine/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Positions",
};

export default async function Page({
  params: { electionDashboardSlug },
}: {
  params: { electionDashboardSlug: string };
}) {
  // const election = await electionCaller.getElectionBySlug({
  //   slug: electionDashboardSlug,
  // });

  const election = await db.query.elections.findFirst({
    where: (election, { eq }) => eq(election.slug, electionDashboardSlug),
  });

  if (!election) notFound();

  // const positions = await electionCaller.getAllPositionsByElectionId({
  //   election_id: election.id,
  // });
  const positions = await db.query.positions.findMany({
    where: (position, { eq }) => eq(position.election_id, election.id),
    orderBy: (position, { asc }) => asc(position.order),
  });
  return (
    <Stack>
      <CreatePosition election_id={election.id} />

      <Group gap="xs">
        {!positions.length ? (
          <Text>No positions yet.</Text>
        ) : (
          positions.map((position) => (
            <Stack key={position.id} className={classes["position-card"]}>
              {/* <Text>{i + 1}</Text> */}

              <Box>
                <Text fw="bold" ta="center">
                  {position.name}
                </Text>

                <Text ta="center">
                  {position.min} - {position.max} candidate(s)
                </Text>
              </Box>

              <Flex gap="xs">
                <EditPosition position={position} data-superjson />
                <DeletePosition position={position} data-superjson />
              </Flex>
            </Stack>
          ))
        )}
      </Group>
    </Stack>
  );
}