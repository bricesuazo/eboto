"use client";

import { api } from "@/trpc/client";
import type { Partylist } from "@eboto-mo/db/schema";
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
  IconLetterCase,
} from "@tabler/icons-react";
import { useEffect } from "react";

export default function EditPartylist({ partylist }: { partylist: Partylist }) {
  const [opened, { open, close }] = useDisclosure(false);
  const form = useForm({
    initialValues: {
      id: partylist.id,
      election_id: partylist.election_id,
      name: partylist.name,
      oldAcronym: partylist.acronym,
      newAcronym: partylist.acronym,
      description: partylist.description,
      logo_link: partylist.logo_link,
    },
    validateInputOnBlur: true,

    validate: {
      name: hasLength(
        {
          min: 3,
          max: 50,
        },
        "Name must be between 3 and 50 characters",
      ),
      newAcronym: hasLength(
        {
          min: 1,
          max: 24,
        },
        "Acronym must be between 1 and 24 characters",
      ),
    },
  });

  const { mutate, isLoading, isError, error, reset } =
    api.election.editPartylist.useMutation({
      onSuccess: () => {
        notifications.show({
          title: `${form.values.name} (${form.values.newAcronym}) updated.`,
          icon: <IconCheck size="1.1rem" />,
          message: "Your changes have been saved.",
          autoClose: 3000,
        });
        close();

        form.resetDirty(form.values);
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

  useEffect(() => {
    if (opened) {
      form.resetDirty();
      reset();
    }
  }, [opened]);

  return (
    <>
      <Button onClick={open} size="compact-sm" variant="subtle">
        Edit
      </Button>
      <Modal
        opened={
          opened
          // || isLoading
        }
        onClose={close}
        title={
          <Text fw={600}>
            Edit Partylist - {partylist.name} ({partylist.acronym})
          </Text>
        }
      >
        <form
          onSubmit={form.onSubmit((value) => {
            mutate({
              id: partylist.id,
              name: value.name,
              oldAcronym: partylist.acronym,
              newAcronym: value.newAcronym,
              election_id: partylist.election_id,
              description: value.description,
              logo_link: value.logo_link,
            });
          })}
        >
          <Stack gap="sm">
            <TextInput
              placeholder="Enter partylist name"
              label="Name"
              required
              withAsterisk
              disabled={isLoading}
              {...form.getInputProps("name")}
              leftSection={<IconLetterCase size="1rem" />}
            />

            <TextInput
              placeholder="Enter acronym"
              label="Acronym"
              required
              withAsterisk
              disabled={isLoading}
              {...form.getInputProps("newAcronym")}
              leftSection={<IconLetterCase size="1rem" />}
            />

            {isError && (
              <Alert
                icon={<IconAlertCircle size="1rem" />}
                color="red"
                title="Error"
                variant="filled"
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
                disabled={!form.isDirty()}
                loading={isLoading}
              >
                Update
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
