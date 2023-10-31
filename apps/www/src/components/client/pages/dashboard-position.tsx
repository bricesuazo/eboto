"use client";

import classes from "@/styles/Position.module.css";
import { api } from "@/trpc/client";
import { Box, Flex, Group, Stack, Text } from "@mantine/core";

import type { RouterOutputs } from "@eboto-mo/api";
import type { Election } from "@eboto-mo/db/schema";

import CreatePosition from "../modals/create-position";
import DeletePosition from "../modals/delete-position";
import EditPosition from "../modals/edit-position";

export default function DashboardPosition({
  election,
  positions,
}: {
  election: Election;
  positions: RouterOutputs["position"]["getDashboardData"];
}) {
  const positionsQuery = api.position.getDashboardData.useQuery(
    {
      election_id: election.id,
    },
    { initialData: positions },
  );

  return (
    <Stack>
      <CreatePosition election_id={election.id} />

      <Group gap="xs">
        {!positionsQuery.data.length ? (
          <Text>No positions yet.</Text>
        ) : (
          positionsQuery.data.map((position) => (
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
                <EditPosition position={position} />
                <DeletePosition position={position} />
              </Flex>
            </Stack>
          ))
        )}
      </Group>
    </Stack>
  );
}
