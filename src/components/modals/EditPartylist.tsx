import {
  Modal,
  Button,
  TextInput,
  Group,
  Stack,
  Alert,
  Text,
} from "@mantine/core";
import { api } from "../../utils/api";
import type { Partylist } from "@prisma/client";
import { hasLength, useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  IconAlertCircle,
  IconCheck,
  IconLetterCase,
} from "@tabler/icons-react";
import { useDidUpdate } from "@mantine/hooks";

const EditPartylistModal = ({
  isOpen,
  onClose,
  partylist,
}: {
  isOpen: boolean;
  onClose: () => void;
  partylist: Partylist;
}) => {
  const context = api.useContext();
  const form = useForm({
    initialValues: {
      name: partylist.name,
      acronym: partylist.acronym,
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

  const editPartylistMutation = api.partylist.editSingle.useMutation({
    onSuccess: async (data) => {
      await context.partylist.getAll.invalidate();

      const dataForForm = {
        name: data.name,
        acronym: data.acronym,
      };

      form.setValues(dataForForm);
      form.resetDirty(dataForForm);

      form.resetDirty();
      notifications.show({
        title: `${data.name} (${data.acronym}) updated!`,
        message: "Successfully updated partylist",
        icon: <IconCheck size="1.1rem" />,
        autoClose: 5000,
      });
      onClose();
    },
  });

  useDidUpdate(() => {
    if (isOpen) {
      editPartylistMutation.reset();
      form.reset();
    }
  }, [isOpen]);

  return (
    <Modal
      opened={isOpen || editPartylistMutation.isLoading}
      onClose={onClose}
      title={
        <Text weight={600}>
          Edit Partylist - {partylist.name} ({partylist.acronym})
        </Text>
      }
    >
      <form
        onSubmit={form.onSubmit((value) => {
          editPartylistMutation.mutate({
            id: partylist.id,
            name: value.name,
            acronym:
              value.acronym === partylist.acronym ? undefined : value.acronym,
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
            icon={<IconLetterCase size="1rem" />}
            error={
              form.errors.acronym ||
              (editPartylistMutation.error?.data?.code === "CONFLICT" &&
                editPartylistMutation.error.message)
            }
          />

          {editPartylistMutation.error?.data?.code === "UNAUTHORIZED" && (
            <Alert
              icon={<IconAlertCircle size="1rem" />}
              color="red"
              title="Error"
              variant="filled"
            >
              {editPartylistMutation.error.message}
            </Alert>
          )}

          <Group position="right" spacing="xs">
            <Button
              variant="default"
              onClick={onClose}
              disabled={editPartylistMutation.isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!form.isDirty()}
              loading={editPartylistMutation.isLoading}
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
