import { Button, Center, Flex, Text } from "@mantine/core";
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
      <Center w={48} h={32} p={4}>
        <Text align="center" w="full">
          {position.name}
        </Text>

        <Flex>
          <Button onClick={open} variant="ghost" size="sm" w="fit-content">
            Edit
          </Button>
          <Button
            onClick={() => deletePositionMutation.mutate(position.id)}
            loading={deletePositionMutation.isLoading}
            variant="ghost"
            color="red"
            size="sm"
            w="fit-content"
          >
            Delete
          </Button>
        </Flex>
      </Center>
    </>
  );
};

export default PositionCard;
