import {
  Modal,
  TextInput,
  Button,
  Alert,
  Group,
  Text,
  Stack,
} from "@mantine/core";
import { api } from "../../utils/api";
import { useEffect } from "react";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconLetterCase } from "@tabler/icons-react";
import { hasLength, useForm } from "@mantine/form";

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
    validateInputOnBlur: true,
    validate: {
      name: hasLength(
        {
          min: 3,
          max: 50,
        },
        "Name must be between 3 and 50 characters"
      ),
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
      onClose={onClose}
      title={<Text weight={600}>Create position</Text>}
    >
      <form
        onSubmit={form.onSubmit((value) => {
          createPositionMutation.mutate({
            name: value.name,
            electionId,
            order,
          });
        })}
      >
        <Stack spacing="sm">
          <TextInput
            placeholder="Enter position name"
            label="Name"
            required
            withAsterisk
            {...form.getInputProps("name")}
            icon={<IconLetterCase size="1rem" />}
          />

          {createPositionMutation.error && (
            <Alert color="red" title="Error">
              {createPositionMutation.error.message}
            </Alert>
          )}
          <Group position="right" spacing="xs">
            <Button
              variant="default"
              onClick={onClose}
              disabled={createPositionMutation.isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!form.isValid()}
              loading={createPositionMutation.isLoading}
            >
              Create
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

export default CreatePositionModal;
