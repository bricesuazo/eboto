"use client";

import { api } from "@/trpc/client";
import {
  Alert,
  Button,
  Group,
  Modal,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { isEmail, useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconAlertCircle,
  IconAt,
  IconCheck,
  IconUserPlus,
} from "@tabler/icons-react";
import { useEffect } from "react";

export default function CreateVoter({ election_id }: { election_id: string }) {
  const [opened, { open, close }] = useDisclosure(false);

  const { mutate, isLoading, isError, error, reset } =
    api.election.createSingleVoter.useMutation({
      onSuccess: () => {
        notifications.show({
          title: `${form.values.email} added!`,
          message: "Successfully deleted partylist",
          icon: <IconCheck size="1.1rem" />,
          autoClose: 5000,
        });
        close();
      },
      onError: (error) => {
        notifications.show({
          title: "Error",
          message: error.message,
          color: "red",
          autoClose: 3000,
        });
      },
    });

  const form = useForm<{
    email: string;
  }>({
    initialValues: {
      email: "",
    },
    validateInputOnBlur: true,
    validate: {
      email: isEmail("Please enter a valid email address"),
    },
  });

  useEffect(() => {
    if (opened) {
      form.reset();
      reset();
    }
  }, [opened]);

  return (
    <>
      <Button
        leftSection={<IconUserPlus size="1rem" />}
        onClick={open}
        disabled={isLoading}
        // style={(theme) => ({
        //   [theme.fn.smallerThan("xs")]: {
        //     width: "100%",
        //   },
        // })}
      >
        Add voter
      </Button>

      <Modal
        opened={opened || isLoading}
        onClose={close}
        title={<Text fw={600}>Add voter</Text>}
      >
        <form
          onSubmit={form.onSubmit((value) => {
            mutate({
              election_id,
              email: value.email,
            });
          })}
        >
          <Stack gap="sm">
            <TextInput
              placeholder="Enter voter's email"
              label="Email address"
              required
              disabled={isLoading}
              withAsterisk
              {...form.getInputProps("email")}
              leftSection={<IconAt size="1rem" />}
            />

            {isError && (
              <Alert
                icon={<IconAlertCircle size="1rem" />}
                title="Error"
                color="red"
              >
                {error.message}
              </Alert>
            )}
            <Group justify="right" gap="xs">
              <Button variant="default" onClick={close} disabled={isLoading}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!form.isValid()}
                loading={isLoading}
              >
                Create
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
