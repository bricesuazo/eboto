"use client";

import { useEffect } from "react";
import {
  Alert,
  Button,
  Group,
  Modal,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { hasLength, useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconAlertCircle,
  IconCheck,
  IconFlag,
  IconLetterCase,
} from "@tabler/icons-react";

import { api } from "~/trpc/client";

export default function CreatePartylist({
  election_id,
}: {
  election_id: string;
}) {
  const context = api.useUtils();
  const [opened, { open, close }] = useDisclosure(false);

  const form = useForm({
    initialValues: {
      name: "",
      acronym: "",
    },
    validate: {
      name: hasLength(
        {
          min: 1,
          max: 100,
        },
        "Name must be between 1 and 100 characters",
      ),
      acronym: hasLength(
        {
          min: 1,
          max: 24,
        },
        "Acronym must be between 1 and 24 characters",
      ),
    },
  });

  const createPartylistMutation = api.partylist.create.useMutation({
    onSuccess: async () => {
      notifications.show({
        title: `${form.values.name} (${form.values.acronym}) created!`,
        message: "Successfully created partylist",
        icon: <IconCheck size="1.1rem" />,
        autoClose: 5000,
      });
      close();

      await context.partylist.getDashboardData.invalidate();
    },
  });

  useEffect(() => {
    if (opened) {
      form.reset();
      createPartylistMutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  return (
    <>
      <Button
        onClick={open}
        style={() => ({
          width: "fit-content",
        })}
        leftSection={<IconFlag size="1rem" />}
      >
        Add partylist
      </Button>
      <Modal
        opened={opened || createPartylistMutation.isPending}
        onClose={close}
        title={<Text fw={600}>Create partylist</Text>}
      >
        <form
          onSubmit={form.onSubmit((value) => {
            createPartylistMutation.mutate({
              name: value.name,
              acronym: value.acronym,
              election_id,
            });
          })}
        >
          <Stack gap="sm">
            <TextInput
              placeholder="Enter partylist name"
              label="Name"
              required
              withAsterisk
              disabled={createPartylistMutation.isPending}
              {...form.getInputProps("name")}
              leftSection={<IconLetterCase size="1rem" />}
            />

            <TextInput
              placeholder="Enter acronym"
              label="Acronym"
              required
              disabled={createPartylistMutation.isPending}
              withAsterisk
              {...form.getInputProps("acronym")}
              leftSection={<IconLetterCase size="1rem" />}
            />

            {createPartylistMutation.isError && (
              <Alert
                icon={<IconAlertCircle size="1rem" />}
                color="red"
                title="Error"
                variant="filled"
              >
                {createPartylistMutation.error.message}
              </Alert>
            )}

            <Group justify="right" gap="xs">
              <Button
                variant="default"
                onClick={close}
                disabled={createPartylistMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!form.isValid()}
                loading={createPartylistMutation.isPending}
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
