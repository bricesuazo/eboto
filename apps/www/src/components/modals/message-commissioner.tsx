"use client";

import { useEffect } from "react";
import { api } from "@/trpc/client";
import {
  Alert,
  Button,
  Group,
  Modal,
  Stack,
  Text,
  Textarea,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconAlertCircle,
  IconCheck,
  IconLetterCase,
  IconMessagePlus,
} from "@tabler/icons-react";
import { zodResolver } from "mantine-form-zod-resolver";
import { z } from "zod";

export default function MessageCommissioner({
  election_id,
}: {
  election_id: string;
}) {
  const context = api.useUtils();
  const [opened, { open, close }] = useDisclosure(false);

  const form = useForm({
    validateInputOnBlur: true,
    validateInputOnChange: true,
    initialValues: {
      title: "",
      message: "",
    },
    validate: zodResolver(
      z.object({
        title: z.string().min(3, "Title must be at least 3 characters"),
        message: z.string().min(10, "Message must be at least 10 characters"),
      }),
    ),
  });

  const messageCommissionerMutation =
    api.election.messageCommissioner.useMutation({
      onSuccess: async () => {
        await context.election.getAllMyMessages.invalidate();
        notifications.show({
          title: "Message sent!",
          message: "Successfully sent message to commissioners",
          icon: <IconCheck size="1.1rem" />,
          autoClose: 5000,
        });
        close();
      },
    });

  useEffect(() => {
    if (opened) {
      form.reset();
      messageCommissionerMutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  return (
    <>
      <Button
        leftSection={<IconMessagePlus />}
        onClick={open}
        variant="subtle"
        radius="xl"
      >
        Message commissioners
      </Button>
      <Modal
        opened={opened || messageCommissionerMutation.isPending}
        onClose={close}
        title={<Text fw={600}>Message commissioners</Text>}
      >
        <form
          onSubmit={form.onSubmit((value) => {
            messageCommissionerMutation.mutate({
              message: value.message,
              title: value.title,
              election_id,
            });
          })}
        >
          <Stack gap="sm">
            <TextInput
              placeholder="Enter title"
              label="Title"
              required
              withAsterisk
              disabled={messageCommissionerMutation.isPending}
              {...form.getInputProps("title")}
              leftSection={<IconLetterCase size="1rem" />}
            />

            <Textarea
              autosize
              placeholder="Describe your message"
              label="Message"
              required
              disabled={messageCommissionerMutation.isPending}
              withAsterisk
              minRows={3}
              maxRows={6}
              {...form.getInputProps("message")}
              leftSection={<IconLetterCase size="1rem" />}
            />

            {messageCommissionerMutation.isError && (
              <Alert
                icon={<IconAlertCircle size="1rem" />}
                color="red"
                title="Error"
                variant="filled"
              >
                {messageCommissionerMutation.error.message}
              </Alert>
            )}

            <Group justify="right" gap="xs">
              <Button
                variant="default"
                onClick={close}
                disabled={messageCommissionerMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!form.isValid()}
                loading={messageCommissionerMutation.isPending}
              >
                Send
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
