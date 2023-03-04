import { Modal, Button, Alert, Group, TextInput } from "@mantine/core";
import { useEffect } from "react";
import { api } from "../../utils/api";
import { notifications } from "@mantine/notifications";
import { useForm } from "@mantine/form";
import { IconCheck } from "@tabler/icons-react";

const CreateVoterModal = ({
  isOpen,
  onClose,
  electionId,
  refetch,
}: {
  electionId: string;
  isOpen: boolean;
  onClose: () => void;
  refetch: () => Promise<unknown>;
}) => {
  const form = useForm({
    initialValues: {
      email: "",
    },
  });

  const createVoterMutation = api.voter.createSingle.useMutation({
    onSuccess: async (data) => {
      await refetch();
      notifications.show({
        title: `${data.email} added!`,
        message: "Successfully added voter",
        icon: <IconCheck size="1.1rem" />,
        autoClose: 5000,
      });
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset();
    } else {
      createVoterMutation.reset();
    }
    // //eslint-disable-next-line
  }, [isOpen]);

  return (
    <Modal
      opened={isOpen || createVoterMutation.isLoading}
      onClose={close}
      title="Add voter"
    >
      <form
        onSubmit={form.onSubmit((value) => {
          void (async () => {
            await createVoterMutation.mutateAsync({
              electionId,
              email: value.email,
            });
            onClose();
          })();
        })}
      >
        <TextInput
          placeholder="Enter voter's email"
          type="text"
          {...form.getInputProps("email")}
        />
        {createVoterMutation.error && (
          <Alert color="red" title="Error">
            {createVoterMutation.error.message}
          </Alert>
        )}
        <Group>
          <Button
            variant="ghost"
            mr={2}
            onClick={onClose}
            disabled={createVoterMutation.isLoading}
          >
            Cancel
          </Button>
          <Button
            color="blue"
            type="submit"
            loading={createVoterMutation.isLoading}
          >
            Create
          </Button>
        </Group>
      </form>
    </Modal>
  );
};

export default CreateVoterModal;
