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
import type { Position } from "@prisma/client";
import { hasLength, useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconLetterCase } from "@tabler/icons-react";
import { useDidUpdate } from "@mantine/hooks";

const EditPartylistModal = ({
  isOpen,
  onClose,
  position,
}: {
  isOpen: boolean;
  onClose: () => void;
  position: Position;
}) => {
  const context = api.useContext();

  const form = useForm({
    initialValues: {
      name: position.name,
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

  const editPositionMutation = api.position.editSingle.useMutation({
    onSuccess: async (data) => {
      await context.position.getAll.invalidate();
      notifications.show({
        title: `${data.name} updated!`,
        message: "Successfully updated position",
        icon: <IconCheck size="1.1rem" />,
        autoClose: 5000,
      });
      onClose();
      form.resetDirty();
    },
  });

  useDidUpdate(() => {
    if (isOpen) {
      editPositionMutation.reset();
    }
  }, [isOpen]);

  return (
    <Modal
      opened={isOpen || editPositionMutation.isLoading}
      onClose={onClose}
      title={<Text weight={600}>Edit Position - {position.name}</Text>}
    >
      <form
        onSubmit={form.onSubmit((value) => {
          editPositionMutation.mutate({
            id: position.id,
            name: value.name,
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

          {editPositionMutation.error && (
            <Alert color="red" title="Error">
              {editPositionMutation.error.message}
            </Alert>
          )}

          <Group position="right" spacing="xs">
            <Button
              variant="default"
              onClick={onClose}
              disabled={editPositionMutation.isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!form.isDirty()}
              loading={editPositionMutation.isLoading}
            >
              Update
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

export default EditPartylistModal;
