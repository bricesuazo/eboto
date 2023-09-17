"use client";

import { api } from "@/trpc/client";
import type { VoterField } from "@eboto-mo/db/schema";
import {
  ActionIcon,
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
  IconEdit,
} from "@tabler/icons-react";
import { useEffect } from "react";

export default function EditVoter({
  election_id,
  voter,
}: {
  election_id: string;
  voter: {
    id: string;
    email: string;
    account_status: "ACCEPTED" | "INVITED" | "DECLINED" | "ADDED";
  };
  voter_fields: VoterField[];
}) {
  const [opened, { open, close }] = useDisclosure(false);

  const form = useForm<{
    email: string;
  }>({
    initialValues: {
      email: voter.email,
    },
    validateInputOnBlur: true,
    validate: {
      email: isEmail("Please enter a valid email address"),
    },
  });

  const { mutate, isLoading, isError, error, reset } =
    api.election.editVoter.useMutation({
      onSuccess: () => {
        notifications.show({
          title: "Success",
          message: "Successfully updated voter!",
          icon: <IconCheck size="1.1rem" />,
          autoClose: 5000,
        });
        close();
      },
    });

  useEffect(() => {
    if (opened) {
      reset();

      const dataForForm: typeof form.values = {
        email: voter.email,
      };

      form.setValues(dataForForm);
      form.resetDirty(dataForForm);
    }
  }, [opened]);

  return (
    <>
      <ActionIcon
        onClick={() => {
          //   setVoterToEdit({
          //     id: row.id,
          //     email: row.getValue<string>("email"),
          //     field: voters.find((v) => v.id === row.id)?.field ?? {},
          //     account_status: row.getValue<
          //       "ACCEPTED" | "INVITED" | "DECLINED" | "ADDED"
          //     >("account_status"),
          //   });
          open();
        }}
      >
        <IconEdit size="1.25rem" />
      </ActionIcon>
      <Modal
        opened={opened || isLoading}
        onClose={close}
        title={<Text fw={600}>Edit voter - {voter.email}</Text>}
      >
        <form
          onSubmit={form.onSubmit((values) => {
            mutate({
              id: voter.id,
              election_id,
              email: values.email,
              account_status: voter.account_status,
            });
          })}
        >
          <Stack gap="sm">
            <TextInput
              placeholder="Enter voter's email"
              label="Email address"
              required
              withAsterisk
              {...form.getInputProps("email")}
              leftSection={<IconAt size="1rem" />}
              disabled={voter.account_status !== "ADDED" || isLoading}
              description={
                voter.account_status !== "ADDED" &&
                "You can only edit the email address of a voter if they have not yet accepted their invitation."
              }
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
                disabled={!form.isValid() || !form.isDirty()}
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
