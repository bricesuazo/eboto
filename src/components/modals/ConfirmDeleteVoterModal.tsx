import { Alert, Button, Group, Modal, Stack, Text } from "@mantine/core";
import { api } from "../../utils/api";
import { notifications } from "@mantine/notifications";
import { IconCheck } from "@tabler/icons-react";
import { IconAlertCircle } from "@tabler/icons-react";

const ConfirmDeleteVoterModal = ({
  isOpen,
  onClose,
  voter,
  electionId,
}: {
  isOpen: boolean;
  onClose: () => void;
  voter: {
    id: string;
    email: string;
    status: "ACCEPTED" | "INVITED" | "DECLINED" | "ADDED";
  };
  electionId: string;
}) => {
  const context = api.useContext();
  const removeVoterMutation = api.voter.removeSingle.useMutation({
    onSuccess: async () => {
      onClose();
      await context.election.getElectionVoter.invalidate();

      notifications.show({
        title: "Successfully deleted!",
        message: `Successfully deleted ${voter.email}`,
        icon: <IconCheck size="1.1rem" />,
        autoClose: 5000,
      });
    },
  });
  return (
    <Modal
      opened={isOpen || removeVoterMutation.isLoading}
      onClose={onClose}
      title={<Text weight={600}>Confirm Delete Voter - {voter.email}</Text>}
    >
      <Stack spacing="sm">
        <Stack>
          <Text>Are you sure you want to delete this voter?</Text>
          <Text>This action cannot be undone.</Text>
        </Stack>
        {removeVoterMutation.error?.data?.code === "UNAUTHORIZED" && (
          <Alert
            icon={<IconAlertCircle size="1rem" />}
            color="red"
            title="Error"
            variant="filled"
          >
            {removeVoterMutation.error.message}
          </Alert>
        )}
        <Group position="right" spacing="xs">
          <Button
            variant="default"
            onClick={onClose}
            disabled={removeVoterMutation.isLoading}
          >
            Cancel
          </Button>
          <Button
            color="red"
            loading={removeVoterMutation.isLoading}
            onClick={() =>
              removeVoterMutation.mutate({
                electionId,
                voterId: voter.id,
                isInvitedVoter: voter.status !== "ACCEPTED" ? true : false,
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

export default ConfirmDeleteVoterModal;
