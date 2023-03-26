import {
  Modal,
  TextInput,
  Button,
  Alert,
  Group,
  Stack,
  Text,
} from "@mantine/core";
import { api } from "../../utils/api";
import { notifications } from "@mantine/notifications";
import {
  IconAlertCircle,
  IconCheck,
  IconLetterCase,
} from "@tabler/icons-react";
import { hasLength, useForm } from "@mantine/form";
import { useDidUpdate } from "@mantine/hooks";

const CreatePartylistModal = ({
  isOpen,
  onClose,
  electionId,
}: {
  isOpen: boolean;
  onClose: () => void;
  electionId: string;
}) => {
  const context = api.useContext();

  const form = useForm({
    initialValues: {
      name: "",
      acronym: "",
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
      acronym: hasLength(
        {
          min: 1,
          max: 24,
        },
        "Acronym must be between 1 and 24 characters"
      ),
    },
  });

  const createPartylistMutation = api.partylist.createSingle.useMutation({
    onSuccess: async (data) => {
      await context.partylist.getAll.invalidate();
      notifications.show({
        title: `${data.name} (${data.acronym}) created!`,
        message: "Successfully created partylist",
        icon: <IconCheck size="1.1rem" />,
        autoClose: 5000,
      });
      onClose();
    },
  });

  useDidUpdate(() => {
    if (isOpen) {
      form.reset();
      createPartylistMutation.reset();
    }
  }, [isOpen]);

  return (
    <Modal
      opened={isOpen || createPartylistMutation.isLoading}
      onClose={onClose}
      title={<Text weight={600}>Create partylist</Text>}
    >
      <form
        onSubmit={form.onSubmit((value) => {
          createPartylistMutation.mutate({
            name: value.name,
            acronym: value.acronym,
            electionId,
          });
        })}
      >
        <Stack spacing="sm">
          <TextInput
            placeholder="Enter partylist name"
            label="Name"
            required
            withAsterisk
            {...form.getInputProps("name")}
            icon={<IconLetterCase size="1rem" />}
          />

          <TextInput
            placeholder="Enter acronym"
            label="Acronym"
            required
            withAsterisk
            {...form.getInputProps("acronym")}
            error={
              form.errors.acronym ||
              (createPartylistMutation.error?.data?.code === "CONFLICT" &&
                createPartylistMutation.error.message)
            }
            icon={<IconLetterCase size="1rem" />}
          />

          {createPartylistMutation.error?.data?.code === "UNAUTHORIZED" && (
            <Alert
              icon={<IconAlertCircle size="1rem" />}
              color="red"
              title="Error"
              variant="filled"
            >
              {createPartylistMutation.error.message}
            </Alert>
          )}

          <Group position="right" spacing="xs">
            <Button
              variant="default"
              onClick={onClose}
              disabled={createPartylistMutation.isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!form.isValid()}
              loading={createPartylistMutation.isLoading}
            >
              Create
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

export default CreatePartylistModal;
