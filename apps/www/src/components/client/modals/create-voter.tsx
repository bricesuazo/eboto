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

export default function CreateVoter({ election_id }: { election_id: string }) {
  const context = api.useContext();
  const [opened, { open, close }] = useDisclosure(false);

  const createSingleVoterMutation = api.voter.createSingle.useMutation({
    onSuccess: async () => {
      await context.election.getVotersByElectionId.invalidate();
      notifications.show({
        title: `${form.values.email} added!`,
        message: "Successfully added voter",
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
      createSingleVoterMutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  return (
    <>
      <Button
        leftSection={<IconUserPlus size="1rem" />}
        onClick={open}
        disabled={createSingleVoterMutation.isLoading}
        // style={(theme) => ({
        //   [theme.fn.smallerThan("xs")]: {
        //     width: "100%",
        //   },
        // })}
      >
        Add voter
      </Button>

      <Modal
        opened={opened || createSingleVoterMutation.isLoading}
        onClose={close}
        title={<Text fw={600}>Add voter</Text>}
      >
        <form
          onSubmit={form.onSubmit((value) => {
            createSingleVoterMutation.mutate({
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
              disabled={createSingleVoterMutation.isLoading}
              withAsterisk
              {...form.getInputProps("email")}
              leftSection={<IconAt size="1rem" />}
            />

            {createSingleVoterMutation.isError && (
              <Alert
                icon={<IconAlertCircle size="1rem" />}
                title="Error"
                color="red"
              >
                {createSingleVoterMutation.error.message}
              </Alert>
            )}
            <Group justify="right" gap="xs">
              <Button
                variant="default"
                onClick={close}
                disabled={createSingleVoterMutation.isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!form.isValid()}
                loading={createSingleVoterMutation.isLoading}
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
