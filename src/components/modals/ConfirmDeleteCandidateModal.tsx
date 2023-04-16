import { Alert, Button, Group, Modal, Stack, Text } from "@mantine/core";
import type { Candidate } from "@prisma/client";
import { api } from "../../utils/api";
import { notifications } from "@mantine/notifications";
import { IconCheck } from "@tabler/icons-react";
import { IconAlertCircle } from "@tabler/icons-react";

const ConfirmDeleteCandidateModal = ({
  isOpen,
  onClose,
  candidate,
}: {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate;
}) => {
  const context = api.useContext();
  const deletePositionMutation = api.candidate.deleteSingle.useMutation({
    onSuccess: async (data) => {
      await context.candidate.getAll.invalidate();
      notifications.show({
        title: `${data.first_name} ${data.last_name} deleted!`,
        message: "Successfully deleted candidate",
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
        <Text weight={600}>
          Confirm Delete Candidate - {candidate.first_name}{" "}
          {candidate.last_name}
          {candidate.middle_name ? ` ${candidate.middle_name}` : ""}
        </Text>
      }
    >
      <Stack spacing="sm">
        <Stack>
          <Text>Are you sure you want to delete this candidate?</Text>
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
            onClick={() => deletePositionMutation.mutate(candidate.id)}
            type="submit"
          >
            Confirm Delete
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default ConfirmDeleteCandidateModal;
