import {
  Modal,
  Button,
  Alert,
  Group,
  TextInput,
  Text,
  Stack,
} from "@mantine/core";
import { api } from "../../utils/api";
import { notifications } from "@mantine/notifications";
import { isEmail, useForm } from "@mantine/form";
import { IconAlertCircle, IconAt, IconCheck } from "@tabler/icons-react";
import { useDidUpdate } from "@mantine/hooks";

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
    validateInputOnBlur: true,
    validate: {
      email: isEmail("Please enter a valid email address"),
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

  useDidUpdate(() => {
    if (isOpen) {
      form.reset();
      createVoterMutation.reset();
    }
  }, [isOpen]);

  return (
    <Modal
      opened={isOpen || createVoterMutation.isLoading}
      onClose={onClose}
      title={<Text weight={600}>Add voter</Text>}
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
        <Stack spacing="sm">
          <TextInput
            placeholder="Enter voter's email"
            label="Email address"
            required
            withAsterisk
            {...form.getInputProps("email")}
            icon={<IconAt size="1rem" />}
            error={
              form.errors.email ||
              (createVoterMutation.error?.data?.code === "CONFLICT" &&
                createVoterMutation.error.message)
            }
          />
          {createVoterMutation.isError &&
            createVoterMutation.error?.data?.code !== "CONFLICT" && (
              <Alert
                icon={<IconAlertCircle size="1rem" />}
                title="Error"
                color="red"
              >
                {createVoterMutation.error?.message}
              </Alert>
            )}
          <Group position="right" spacing="xs">
            <Button
              variant="default"
              onClick={onClose}
              disabled={createVoterMutation.isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!form.isValid()}
              loading={createVoterMutation.isLoading}
            >
              Create
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

export default CreateVoterModal;
