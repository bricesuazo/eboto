"use client";

import { api } from "@/trpc/client";
import type { VoterField } from "@eboto-mo/db/schema";
import {
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
import { IconAt, IconLetterCase, IconUserPlus } from "@tabler/icons-react";
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
  //         leftSection: <IconCheck size="1.1rem" />,
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

  const [data] = useState<
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
      // reset();
    }
  }, [opened]);

  return (
    <>
      <Button
        leftSection={<IconUserPlus size="1rem" />}
        onClick={open}
        // disabled={isLoading}
        // style={(theme) => ({
        //   [theme.fn.smallerThan("xs")]: {
        //     width: "100%",
        //   },
        // })}
      >
        Add voter
      </Button>

      <Modal
        opened={
          opened
          // || isLoading
        }
        onClose={close}
        title={<Text fw={600}>Add voter</Text>}
      >
        <form
          onSubmit={form.onSubmit((value) => {
            void (async () => {
              await api.election.createVoter.mutate({
                election_id,
                email: value.email,

                field: voter_fields.reduce(
                  (acc, field) => {
                    acc[field.name] = value[field.name]!;

                    return acc;
                  },
                  {} as Record<string, string>,
                ),
              });
            })();
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
                    })) ?? []
                }
                // onCreate={(query) => {
                //   setData((prev) =>
                //     prev.map((item) => {
                //       if (item.fieldName === field.name) {
                //         item.values.push({ value: query });
                //       }
                //       return item;
                //     }),
                //   );
                //   return query;
                // }}
                label={field.name}
                placeholder={`Enter ${field.name}`}
                // nothingFound="Nothing found"
                searchable
                // creatable
                // withinPortal
                // getCreateLabel={(query) => `+ Create ${query}`}
                {...form.getInputProps(field.name)}
                required
                withAsterisk
                leftSection={<IconLetterCase size="1rem" />}
              />
            ))}
            {/* {isError && (
              <Alert
                leftSection={<IconAlertCircle size="1rem" />}
                title="Error"
                color="red"
              >
                {error.message}
              </Alert>
            )} */}
            <Group justify="right" gap="xs">
              <Button
                variant="default"
                onClick={close}
                // disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!form.isValid()}
                // loading={isLoading}
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
