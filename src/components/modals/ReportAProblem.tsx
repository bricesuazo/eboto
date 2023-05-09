import {
  Button,
  Group,
  Modal,
  Stack,
  Text,
  TextInput,
  Textarea,
} from "@mantine/core";
import { hasLength, isEmail, useForm } from "@mantine/form";
import { useDidUpdate } from "@mantine/hooks";
import { useSession } from "next-auth/react";

const ReportAProblem = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const session = useSession();
  const form = useForm<{ email: string; subject: string; description: string }>(
    {
      initialValues: {
        email: session.data?.user.email ?? "",
        subject: "",
        description: "",
      },
      validateInputOnBlur: true,
      clearInputErrorOnChange: true,
      validate: {
        email: isEmail("Please enter a valid email address"),
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
    }
  );

  useDidUpdate(() => {
    if (session.data) {
      form.setValues({
        email: session.data.user.email,
      });
      form.resetDirty({
        ...form.values,
        email: session.data.user.email,
      });
    }
  }, [session.data]);

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
          console.log(values);
        })}
      >
        <Stack>
          <TextInput
            label="Email address"
            placeholder="Enter your email address"
            required
            withAsterisk
            readOnly
            disabled
            {...form.getInputProps("email")}
          />
          <TextInput
            label="Subject"
            placeholder="What's the problem?"
            required
            withAsterisk
            {...form.getInputProps("subject")}
          />
          <Textarea
            label="Description"
            placeholder="Describe the problem"
            required
            withAsterisk
            autosize
            minRows={4}
            maxRows={8}
            {...form.getInputProps("description")}
          />

          <Group position="right" spacing="xs">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button disabled={!form.isValid()} type="submit">
              Submit
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

export default ReportAProblem;
