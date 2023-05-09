import {
  Button,
  Group,
  Modal,
  Stack,
  Text,
  TextInput,
  Textarea,
} from "@mantine/core";
import { hasLength, useForm } from "@mantine/form";
import { useDidUpdate } from "@mantine/hooks";
import { api } from "../../utils/api";
import { notifications } from "@mantine/notifications";
import { IconCheck } from "@tabler/icons-react";

const ReportAProblem = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const reportProblemMutation = api.system.reportProblem.useMutation({
    onSuccess: () => {
      onClose();

      notifications.show({
        title: "Success!",
        message: "Your problem has been reported.",
        icon: <IconCheck size="1.1rem" />,
        autoClose: 5000,
      });
    },
  });
  const form = useForm<{ subject: string; description: string }>({
    initialValues: {
      subject: "",
      description: "",
    },
    validateInputOnBlur: true,
    clearInputErrorOnChange: true,
    validate: {
      subject: hasLength(
        {
          min: 3,
          max: 50,
        },
        "Subject must be between 3 and 50 characters"
      ),
      description: hasLength(
        {
          min: 10,
          max: 500,
        },
        "Description must be between 10 and 500 characters"
      ),
    },
  });

  useDidUpdate(() => {
    if (isOpen) {
      form.reset();
    }
  }, [isOpen]);

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title={<Text weight={600}>Report a problem</Text>}
    >
      <form
        onSubmit={form.onSubmit((values) => {
          reportProblemMutation.mutate({
            subject: values.subject,
            description: values.description,
          });
        })}
      >
        <Stack>
          <TextInput
            label="Subject"
            placeholder="What's the problem?"
            required
            withAsterisk
            {...form.getInputProps("subject")}
            disabled={reportProblemMutation.isLoading}
          />
          <Textarea
            label="Description"
            placeholder="Describe the problem"
            required
            withAsterisk
            autosize
            minRows={4}
            maxRows={8}
            disabled={reportProblemMutation.isLoading}
            {...form.getInputProps("description")}
          />

          <Group position="right" spacing="xs">
            <Button
              variant="default"
              onClick={onClose}
              disabled={reportProblemMutation.isLoading}
            >
              Cancel
            </Button>
            <Button
              disabled={!form.isValid()}
              type="submit"
              loading={reportProblemMutation.isLoading}
            >
              Submit
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

export default ReportAProblem;
