"use client";

import { type VoterField, voters } from "@eboto-mo/db/schema";
import {
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
import { IconCheck } from "@tabler/icons-react";
import {
  IconAlertCircle,
  IconAt,
  IconLetterCase,
  IconUserPlus,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";

export default function CreateVoter({
  election_id,
  voter_fields,
}: {
  election_id: string;
  voter_fields: VoterField[];
}) {
  const [opened, { open, close }] = useDisclosure(false);

  // const { mutate, isLoading, isError, error, reset } =
  //   api.election.createVoter.useMutation({
  //     onSuccess: async () => {
  //       notifications.show({
  //         title: `${form.values.email} added!`,
  //         message: "Successfully deleted partylist",
  //         icon: <IconCheck size="1.1rem" />,
  //         autoClose: 5000,
  //       });
  //       close();
  //     },
  //     onError: (error) => {
  //       notifications.show({
  //         title: "Error",
  //         message: error.message,
  //         color: "red",
  //         autoClose: 3000,
  //       });
  //     },
  //   });

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
    [key: string]: string;
  }>({
    initialValues: {
      email: "",
      ...voter_fields.reduce(
        (acc, field) => {
          acc[field.name] = "";
          return acc;
        },
        {} as Record<string, string>,
      ),
    },
    validateInputOnBlur: true,
    validate: {
      email: isEmail("Please enter a valid email address"),
      ...voter_fields.reduce(
        (acc, field) => {
          acc[field.name] = (value) =>
            value?.trim() === "" ? `${field.name} is required` : undefined;
          return acc;
        },
        {} as Record<string, (value: string) => string | undefined>,
      ),
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
        leftIcon={<IconUserPlus size="1rem" />}
        onClick={open}
        disabled={isLoading}
        sx={(theme) => ({
          [theme.fn.smallerThan("xs")]: {
            width: "100%",
          },
        })}
      >
        Add voter
      </Button>

      <Modal
        opened={opened || isLoading}
        onClose={close}
        title={<Text weight={600}>Add voter</Text>}
      >
        <form
          onSubmit={form.onSubmit((value) => {
            mutate({
              election_id,
              email: value.email,

              field: voter_fields.reduce(
                (acc, field) => {
                  acc[field.name] = value[field.name];
                  return acc;
                },
                {} as Record<string, string>,
              ),
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
                {...form.getInputProps(field.name)}
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
