import { Alert, Button, Group, Mark, Modal, Stack, Text } from "@mantine/core";
import type { Partylist } from "@prisma/client";
import { api } from "../../utils/api";
import { notifications } from "@mantine/notifications";
import { IconCheck } from "@tabler/icons-react";
import { IconAlertCircle } from "@tabler/icons-react";

const ConfirmDeletePartylistModal = ({
  isOpen,
  onClose,
  partylist,
}: {
  isOpen: boolean;
  onClose: () => void;
  partylist: Partylist;
}) => {
  const context = api.useContext();
  const deletePartylistMutation = api.partylist.deleteSingle.useMutation({
    onSuccess: async (data) => {
      await context.partylist.getAll.invalidate();
      notifications.show({
        title: `${data.name} (${data.acronym}) deleted!`,
        message: "Successfully deleted partylist",
        icon: <IconCheck size="1.1rem" />,
        autoClose: 5000,
      });
    },
  });
  return (
    <Modal
      opened={isOpen || deletePartylistMutation.isLoading}
      onClose={onClose}
      title={
        <Text weight={600}>
          Confirm Delete Partylist - {partylist.name} ({partylist.acronym})
        </Text>
      }
    >
      <Stack spacing="sm">
        <Stack>
          <Text>Are you sure you want to delete this partylist?</Text>
          <Mark p="sm" color="red">
            This will also delete all the candidates under this partylist. Make
            sure you change the partylist of the candidates first.
          </Mark>
          <Text>This action cannot be undone.</Text>
        </Stack>
        {deletePartylistMutation.error?.data?.code === "UNAUTHORIZED" && (
          <Alert
            icon={<IconAlertCircle size="1rem" />}
            color="red"
            title="Error"
            variant="filled"
          >
            {deletePartylistMutation.error.message}
          </Alert>
        )}
        <Group position="right" spacing="xs">
          <Button
            variant="default"
            onClick={close}
            disabled={deletePartylistMutation.isLoading}
          >
            Cancel
          </Button>
          <Button
            color="red"
            loading={deletePartylistMutation.isLoading}
            onClick={() => deletePartylistMutation.mutate(partylist.id)}
            type="submit"
          >
            Confirm Delete
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default ConfirmDeletePartylistModal;
