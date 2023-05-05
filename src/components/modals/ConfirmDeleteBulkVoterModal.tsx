import { Alert, Button, Group, List, Modal, Stack, Text } from "@mantine/core";
import { api } from "../../utils/api";
import { notifications } from "@mantine/notifications";
import { IconCheck } from "@tabler/icons-react";
import { IconAlertCircle } from "@tabler/icons-react";
import { type Dispatch, type SetStateAction } from "react";
import { type MRT_RowSelectionState } from "mantine-react-table";

const ConfirmDeleteBulkVoterModal = ({
  isOpen,
  onClose,
  voters,
  electionId,
  setRowSelection,
}: {
  isOpen: boolean;
  onClose: () => void;
  voters: {
    id: string;
    email: string;
  }[];
  electionId: string;
  setRowSelection: Dispatch<SetStateAction<MRT_RowSelectionState>>;
}) => {
  const context = api.useContext();
  const removeBulkVoterMutation = api.voter.removeBulk.useMutation({
    onSuccess: async () => {
      onClose();
      await context.election.getElectionVoter.invalidate();
      setRowSelection({});

      notifications.show({
        title: "Successfully deleted!",
        message: `Successfully deleted voters`,
        icon: <IconCheck size="1.1rem" />,
        autoClose: 5000,
      });
    },
  });
  return (
    <Modal
      opened={isOpen || removeBulkVoterMutation.isLoading}
      onClose={onClose}
      title={<Text weight={600}>Confirm Delete Voter(s)</Text>}
    >
      <Stack spacing="sm">
        <Text>
          Are you sure you want to delete this voter(s)? This action cannot be
          undone.
        </Text>

        <List>
          {voters.map((voter) => (
            <List.Item key={voter.id}>{voter.email}</List.Item>
          ))}
        </List>
        {removeBulkVoterMutation.error?.data?.code === "UNAUTHORIZED" && (
          <Alert
            icon={<IconAlertCircle size="1rem" />}
            color="red"
            title="Error"
            variant="filled"
          >
            {removeBulkVoterMutation.error.message}
          </Alert>
        )}
        <Group position="right" spacing="xs">
          <Button
            variant="default"
            onClick={onClose}
            disabled={removeBulkVoterMutation.isLoading}
          >
            Cancel
          </Button>
          <Button
            color="red"
            loading={removeBulkVoterMutation.isLoading}
            onClick={() =>
              removeBulkVoterMutation.mutate({
                electionId,
                voterIds: voters.map((voter) => voter.id),
              })
            }
          >
            Confirm Delete
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default ConfirmDeleteBulkVoterModal;
