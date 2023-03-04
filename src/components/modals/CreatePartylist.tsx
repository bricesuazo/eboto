import { Modal, TextInput, Button, Alert, Group } from "@mantine/core";
import { api } from "../../utils/api";
import { useEffect } from "react";
import { notifications } from "@mantine/notifications";
import { IconCheck } from "@tabler/icons-react";
import { useForm } from "@mantine/form";

const CreatePartylistModal = ({
  isOpen,
  onClose,
  electionId,
  refetch,
}: {
  isOpen: boolean;
  onClose: () => void;
  electionId: string;
  refetch: () => Promise<unknown>;
}) => {
  const form = useForm({
    initialValues: {
      name: "",
      acronym: "",
    },
  });

  const createPartylistMutation = api.partylist.createSingle.useMutation({
    onSuccess: async (data) => {
      await refetch();
      notifications.show({
        title: `${data.name} (${data.acronym}) created!`,
        message: "Successfully created partylist",
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
      createPartylistMutation.reset();
    }
  }, [isOpen]);

  return (
    <Modal
      opened={isOpen || createPartylistMutation.isLoading}
      onClose={close}
      title="Create partylist"
    >
      <form
        onSubmit={form.onSubmit((value) => {
          void (async () => {
            await createPartylistMutation.mutateAsync({
              name: value.name,
              acronym: value.acronym,
              electionId,
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

        {createPartylistMutation.error && (
          <Alert color="red" title="Error">
            {createPartylistMutation.error.message}
          </Alert>
        )}
        <Group>
          <Button
            variant="ghost"
            mr={2}
            onClick={onClose}
            disabled={createPartylistMutation.isLoading}
          >
            Cancel
          </Button>
          <Button
            color="blue"
            type="submit"
            loading={createPartylistMutation.isLoading}
          >
            Create
          </Button>
        </Group>
      </form>
    </Modal>
  );
};

export default CreatePartylistModal;
