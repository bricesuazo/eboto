"use client";

import { Flex, Group, Stack, Text, Title } from "@mantine/core";
import { useRouter } from "next/navigation";
import CreatePosition from "../modals/create-position";
import { Election, Position } from "@eboto-mo/db/schema";
import DeletePosition from "@/components/client/modals/delete-position";
import EditPosition from "@/components/client/modals/edit-position";
export default function DashboardPosition({
  election,
  positions,
}: {
  election: Election;
  positions: Position[];
}) {
  const router = useRouter();

  return (
    <Stack>
      <CreatePosition election_id={election.id} order={positions.length} />

      <Group spacing="xs">
        {!positions.length ? (
          <Text>No positions yet.</Text>
        ) : (
          positions.map((position) => (
            <Position
              key={position.id}
              position={position}
              order={positions.length}
            />
          ))
        )}
      </Group>
    </Stack>
  );
}

const Position = ({
  position,
  order,
}: {
  position: Position;
  order: number;
}) => {
  return (
    <>
      <Flex
        direction="column"
        w={172}
        align="center"
        p={8}
        sx={(theme) => ({
          flexDirection: "column",
          justifyContent: "space-between",
          alignItems: "center",
          width: 200,
          height: 128,
          padding: theme.spacing.md,
          border: "1px solid",
          borderColor:
            theme.colorScheme === "dark"
              ? theme.colors.dark[5]
              : theme.colors.gray[3],
          borderRadius: theme.radius.md,

          [theme.fn.smallerThan("xs")]: {
            width: "100%",
          },
        })}
      >
        <Title order={4} align="center" w="full" lineClamp={2}>
          {position.name}
        </Title>

        <Group spacing="xs">
          <EditPosition position={position} order={order} />
          <DeletePosition position={position} />
        </Group>
      </Flex>
    </>
  );
};
