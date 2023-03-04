import {
  Modal,
  TextInput,
  Button,
  Alert,
  Group,
} from "@mantine/core";
import { api } from "../../utils/api";
import { useEffect } from "react";
import { notifications } from "@mantine/notifications";
import { IconCheck } from "@tabler/icons-react";
import { useForm } from "@mantine/form";

const CreatePositionModal = ({
  isOpen,
  onClose,
  electionId,
  order,
  refetch,
}: {
  isOpen: boolean;
  onClose: () => void;
  electionId: string;
  order: number;
  refetch: () => Promise<unknown>;
}) => {
  const form = useForm({
    initialValues: {
      name: "",
    },
  });

  const createPositionMutation = api.position.createSingle.useMutation({
    onSuccess: async (data) => {
      await refetch();
      notifications.show({
        title: `${data.name} created!`,
        message: "Successfully created position",
        icon: <IconCheck size="1.1rem" />,
        autoClose: 5000,
      });
      onClose();
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset();
    } else {
      createPositionMutation.reset();
    }
  }, [isOpen]);

  return (
    <Modal
      opened={isOpen || createPositionMutation.isLoading}
      onClose={close}
      title="Create position"
    >
      <form
        onSubmit={form.onSubmit((value) => {
          void (async () => {
            await createPositionMutation.mutateAsync({
              name: value.name,
              electionId,
              order,
            });
          })();
        })}
      >
        <TextInput
          placeholder="Enter position name"
          type="text"
          {...form.getInputProps("name")}
        />

        {createPositionMutation.error && (
          <Alert color="red" title="Error">
            {createPositionMutation.error.message}
          </Alert>
        )}
        <Group>
          <Button
            variant="ghost"
            mr={2}
            onClick={onClose}
            disabled={createPositionMutation.isLoading}
          >
            Cancel
          </Button>
          <Button
            color="blue"
            type="submit"
            loading={createPositionMutation.isLoading}
          >
            Create
          </Button>
        </Group>
      </form>
    </Modal>
  );
};

export default CreatePositionModal;
