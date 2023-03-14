import { Button, Flex, Group, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import type { Position } from "@prisma/client";
import { IconCheck } from "@tabler/icons-react";
import { api } from "../utils/api";
import EditPositionModal from "./modals/EditPosition";

const PositionCard = ({
  position,
  refetch,
}: {
  position: Position;
  refetch: () => Promise<unknown>;
}) => {
  const [opened, { open, close }] = useDisclosure(false);
  const deletePositionMutation = api.position.deleteSingle.useMutation({
    onSuccess: async (data) => {
      await refetch();
      notifications.show({
        title: `${data.name} deleted!`,
        message: "Successfully deleted position",
        icon: <IconCheck size="1.1rem" />,
        autoClose: 5000,
      });
    },
  });

  return (
    <>
      <EditPositionModal
        isOpen={opened}
        onClose={close}
        position={position}
        refetch={refetch}
      />
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
          <Button onClick={open} variant="light" size="sm" compact>
            Edit
          </Button>
          <Button
            onClick={() => deletePositionMutation.mutate(position.id)}
            loading={deletePositionMutation.isLoading}
            variant="light"
            color="red"
            size="sm"
            compact
          >
            Delete
          </Button>
        </Group>
      </Flex>
    </>
  );
};

export default PositionCard;
