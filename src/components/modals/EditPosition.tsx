import { Modal, Input, Button, Alert, Group } from "@mantine/core";
import { api } from "../../utils/api";
import { useEffect } from "react";
import type { Position } from "@prisma/client";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconCheck } from "@tabler/icons-react";

const EditPartylistModal = ({
  isOpen,
  onClose,
  position,
  refetch,
}: {
  isOpen: boolean;
  onClose: () => void;
  position: Position;
  refetch: () => Promise<unknown>;
}) => {
  const form = useForm({
    initialValues: {
      name: position.name,
    },
  });

  const editPositionMutation = api.position.editSingle.useMutation({
    onSuccess: async (data) => {
      await refetch();
      notifications.show({
        title: `${data.name} updated!`,
        message: "Successfully updated position",
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
      editPositionMutation.reset();
    }
  }, [isOpen]);

  return (
    <Modal
      opened={isOpen || editPositionMutation.isLoading}
      onClose={close}
      title={`Edit Position - ${position.name}`}
    >
      <form
        onSubmit={form.onSubmit((value) => {
          void (async () => {
            await editPositionMutation.mutateAsync({
              id: position.id,
              name: value.name,
            });
          })();
        })}
      >
        <Input
          placeholder="Enter position name"
          type="text"
          {...form.getInputProps("name")}
        />

        {editPositionMutation.error && (
          <Alert color="red" title="Error">
            {editPositionMutation.error.message}
          </Alert>
        )}
        <Group>
          <Button
            variant="ghost"
            mr={2}
            onClick={onClose}
            disabled={editPositionMutation.isLoading}
          >
            Cancel
          </Button>
          <Button
            color="blue"
            type="submit"
            loading={editPositionMutation.isLoading}
          >
            Create
          </Button>
        </Group>
      </form>
    </Modal>
  );
};

export default EditPartylistModal;
