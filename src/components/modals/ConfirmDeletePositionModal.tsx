import { Alert, Button, Group, Mark, Modal, Stack, Text } from "@mantine/core";
import type { Position } from "@prisma/client";
import { api } from "../../utils/api";
import { notifications } from "@mantine/notifications";
import { IconCheck } from "@tabler/icons-react";
import { IconAlertCircle } from "@tabler/icons-react";

const ConfirmDeletePositionModal = ({
  isOpen,
  onClose,
  position,
}: {
  isOpen: boolean;
  onClose: () => void;
  position: Position;
}) => {
  const context = api.useContext();
  const deletePositionMutation = api.position.deleteSingle.useMutation({
    onSuccess: async (data) => {
      await context.position.getAll.invalidate();
      notifications.show({
        title: `${data.name} deleted!`,
        message: "Successfully deleted position",
        icon: <IconCheck size="1.1rem" />,
        autoClose: 5000,
      });
    },
  });

  return (
    <Modal
      opened={isOpen || deletePositionMutation.isLoading}
      onClose={onClose}
      title={
        <Text weight={600}>Confirm Delete Position - {position.name}</Text>
      }
    >
      <Stack spacing="sm">
        <Stack>
          <Text>Are you sure you want to delete this position?</Text>
          <Mark p="sm" color="red">
            This will also delete all the candidates under this position. Make
            sure you change the position of the candidates first.
          </Mark>
          <Text>This action cannot be undone.</Text>
        </Stack>
        {deletePositionMutation.error?.data?.code === "UNAUTHORIZED" && (
          <Alert
            icon={<IconAlertCircle size="1rem" />}
            color="red"
            title="Error"
            variant="filled"
          >
            {deletePositionMutation.error.message}
          </Alert>
        )}
        <Group position="right" spacing="xs">
          <Button
            variant="default"
            onClick={onClose}
            disabled={deletePositionMutation.isLoading}
          >
            Cancel
          </Button>
          <Button
            color="red"
            loading={deletePositionMutation.isLoading}
            onClick={() => deletePositionMutation.mutate(position.id)}
            type="submit"
          >
            Confirm Delete
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default ConfirmDeletePositionModal;
