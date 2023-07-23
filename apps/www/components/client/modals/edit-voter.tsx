"use client";

import { api_client } from "@/shared/client/trpc";
import type { VoterField } from "@eboto-mo/db/schema";
import {
  ActionIcon,
  Alert,
  Button,
  Group,
  Modal,
  Select,
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
  IconLetterCase,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";

export default function EditVoter({
  election_id,
  voter,
  voter_fields,
}: {
  election_id: string;
  voter: {
    id: string;
    field: { [key: string]: string };
    email: string;
    account_status: "ACCEPTED" | "INVITED" | "DECLINED" | "ADDED";
  };
  voter_fields: VoterField[];
}) {
  const [opened, { open, close }] = useDisclosure(false);
  const [data, setData] = useState<
    {
      fieldName: string;
      values: {
        value: string;
      }[];
    }[]
  >([]);
  const form = useForm<{
    email: string;
    field: {
      [key: string]: string;
    };
  }>({
    initialValues: {
      email: voter.email,
      field: voter.field ?? {},
    },
    validateInputOnBlur: true,
    validate: {
      email: isEmail("Please enter a valid email address"),
      field: voter_fields.reduce(
        (acc, field) => {
          acc[field.name] = (value) =>
            value === undefined || value.trim() === ""
              ? `${field.name} is required`
              : undefined;
          return acc;
        },
        {} as Record<string, (value: string | undefined) => string | undefined>,
      ),
    },
  });

  const { mutate, isLoading, isError, error, reset } =
    api_client.election.editVoter.useMutation({
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
        field: voter.field,
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
        title={<Text weight={600}>Edit voter - {voter.email}</Text>}
      >
        <form
          onSubmit={form.onSubmit((values) => {
            mutate({
              id: voter.id,
              election_id,
              field: values.field,
              email: values.email,
              account_status: voter.account_status,
            });
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
              disabled={voter.account_status !== "ADDED"}
              description={
                voter.account_status !== "ADDED" &&
                "You can only edit the email address of a voter if they have not yet accepted their invitation."
              }
            />

            {voter_fields.map((field) => (
              <Select
                key={field.id}
                data={
                  data
                    .find((item) => item.fieldName === field.name)
                    ?.values.map((item) => ({
                      value: item.value,
                      label: item.value,
                    })) || []
                }
                onCreate={(query) => {
                  setData((prev) =>
                    prev.map((item) => {
                      if (item.fieldName === field.name) {
                        item.values.push({ value: query });
                      }
                      return item;
                    }),
                  );
                  return query;
                }}
                label={field.name}
                placeholder={`Enter ${field.name}`}
                nothingFound="Nothing found"
                searchable
                creatable
                withinPortal
                getCreateLabel={(query) => `+ Create ${query}`}
                {...form.getInputProps(["field", field.name].join("."))}
                required
                withAsterisk
                icon={<IconLetterCase size="1rem" />}
              />
            ))}

            {isError && (
              <Alert
                icon={<IconAlertCircle size="1rem" />}
                title="Error"
                color="red"
              >
                {error.message}
              </Alert>
            )}
            <Group position="right" spacing="xs">
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
