import { Modal, Button, Alert, TextInput, Group } from "@mantine/core";
import { api } from "../../utils/api";
import { useEffect } from "react";
import type { Partylist } from "@prisma/client";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconCheck } from "@tabler/icons-react";

const EditPartylistModal = ({
  isOpen,
  onClose,
  partylist,
  refetch,
}: {
  isOpen: boolean;
  onClose: () => void;
  partylist: Partylist;
  refetch: () => Promise<unknown>;
}) => {
  const form = useForm({
    initialValues: {
      name: partylist.name,
      acronym: partylist.acronym,
    },
  });

  const editPartylistMutation = api.partylist.editSingle.useMutation({
    onSuccess: async (data) => {
      await refetch();
      notifications.show({
        title: `${data.name} (${data.acronym}) updated!`,
        message: "Successfully updated partylist",
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
      editPartylistMutation.reset();
    }
  }, [isOpen]);

  return (
    <Modal
      opened={isOpen || editPartylistMutation.isLoading}
      onClose={close}
      title={`Edit Partylist - ${partylist.name} (${partylist.acronym})`}
    >
      <form
        onSubmit={form.onSubmit((value) => {
          void (async () => {
            await editPartylistMutation.mutateAsync({
              id: partylist.id,
              name: value.name,
              acronym: value.acronym,
            });
          })();
        })}
      >
        <TextInput
          placeholder="Enter partylist name"
          type="text"
          {...form.getInputProps("name")}
        />

        <TextInput
          placeholder="Enter acronym"
          type="text"
          {...form.getInputProps("acronym")}
        />

        {editPartylistMutation.error && (
          <Alert color="red" title="Error">
            {editPartylistMutation.error.message}
          </Alert>
        )}
        <Group>
          <Button
            variant="ghost"
            mr={2}
            onClick={onClose}
            disabled={editPartylistMutation.isLoading}
          >
            Cancel
          </Button>
          <Button
            color="blue"
            type="submit"
            loading={editPartylistMutation.isLoading}
          >
            Create
          </Button>
        </Group>
      </form>
    </Modal>
  );
};

export default EditPartylistModal;
