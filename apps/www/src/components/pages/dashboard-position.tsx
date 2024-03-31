"use client";

import classes from "@/styles/Position.module.css";
import { api } from "@/trpc/client";
import { Box, Flex, Group, Stack, Text } from "@mantine/core";

import type { RouterOutputs } from "@eboto/api";

import type { Database } from "../../../../../supabase/types";
import CreatePosition from "../modals/create-position";
import DeletePosition from "../modals/delete-position";
import EditPosition from "../modals/edit-position";

export default function DashboardPosition({
  election,
  positions,
}: {
  election: Database["public"]["Tables"]["elections"]["Row"];
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

                <Text fz="sm" ta="center">
                  {`${
                    position.min === 0
                      ? position.max
                      : `${position.min} - ${position.max}`
                  } candidate${
                    position.max - position.min > 1 || position.min > 0
                      ? "s"
                      : ""
                  }`}
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
