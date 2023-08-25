"use client";

import { api } from "@/trpc/client";
import type { Election, VoterField } from "@eboto-mo/db/schema";
import {
  ActionIcon,
  Button,
  Flex,
  Group,
  Modal,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { IconTrash, IconUsersGroup } from "@tabler/icons-react";
import { useEffect } from "react";

interface Field {
  id: string;
  name: string;
  type: "fromDb" | "fromInput";
}
interface FormType {
  field: Field[];
}

export default function UpdateVoterField({
  election,
  // voters,
  isDisabled,
}: {
  election: Election & { voter_fields: VoterField[] };
  voters: {
    id: string;
    email: string;
  }[];
  isDisabled: boolean;
}) {
  const [opened, { open, close }] = useDisclosure(false);

  // const { mutate, isLoading, isError, error, reset } =
  //   api.election.updateVoterField.useMutation({
  //     onSuccess: async () => {
  //       notifications.show({
  //         title: ``,
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

  const form = useForm<FormType>({
    initialValues: {
      field: election.voter_fields.map((field) => ({
        type: "fromDb",
        id: field.id,
        name: field.name,
      })),
    },
    validate: {
      field: (value) => {
        if (value.length === 0) return "At least one field is required";

        if (value.some((field) => field.name.trim() === ""))
          return "Field name is required";
      },
    },
  });

  useEffect(() => {
    if (opened) {
      // reset();
      const data: typeof form.values.field = election.voter_fields.map(
        (field) => ({
          id: field.id,
          name: field.name,
          type: "fromDb",
        }),
      );
      form.setValues({ field: data });

      form.resetDirty({ field: data });
    }
  }, [opened]);

  return (
    <>
      <Button
        variant="light"
        leftSection={<IconUsersGroup size="1rem" />}
        onClick={open}
        disabled={isDisabled}
        // style={(theme) => ({
        //   [theme.fn.smallerThan("xs")]: {
        //     width: "100%",
        //   },
        // })}
      >
        Group
      </Button>

      <Modal
        opened={
          opened
          // || isLoading
        }
        onClose={close}
        title={<Text fw={600}>Voter Field</Text>}
      >
        <form
          onSubmit={form.onSubmit((values) => {
            void (async () => {
              await api.election.updateVoterField.mutate({
                election_id: election.id,
                fields: values.field,
              });
            })();
          })}
        >
          <Stack gap="sm">
            <Group justify="end">
              <TextInput
                value="Email address"
                w="100%"
                disabled
                label="Voter field"
                withAsterisk
              />
            </Group>

            {form.values.field.map((field) => (
              <VoterFieldInput
                key={field.id}
                form={form}
                field={field}
                election_id={election.id}
              />
            ))}

            <Button
              disabled={
                form.values.field[form.values.field.length - 1]?.name.trim() ===
                ""
              }
              onClick={() => {
                form.setFieldValue("field", [
                  ...form.values.field,
                  {
                    id: Math.random().toString(),
                    name: "",
                    type: "fromInput",
                  },
                ]);
              }}
            >
              Add voter field
            </Button>

            {/* {isError && (
              <Alert
                icon={<IconAlertCircle size="1rem" />}
                color="red"
                title="Error"
                variant="filled"
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
                // loading={isLoading}
                disabled={!(form.isValid() && form.isDirty())}
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

function VoterFieldInput({
  form,
  field,
  election_id,
}: {
  form: UseFormReturnType<FormType, (values: FormType) => FormType>;
  field: Field;
  election_id: string;
}) {
  return (
    <Flex gap="xs" align="end">
      <TextInput
        w="100%"
        placeholder="Enter field"
        value={field.name}
        label="Voter field"
        withAsterisk
        onChange={(e) => {
          form.setFieldValue(
            "field",
            form.values.field.map((f) => {
              if (f.id === field.id) {
                return {
                  ...f,
                  name: e.currentTarget.value,
                };
              }
              return f;
            }),
          );
        }}
      />
      <ActionIcon
        color="red"
        variant="outline"
        size="2.25rem"
        // loading={isLoading}
        loaderProps={{
          w: 18,
        }}
        onClick={() => {
          if (field.type === "fromDb") {
            void (async () => {
              await api.election.deleteSingleVoterField.mutate({
                election_id,
                field_id: field.id,
              });
            })();
          } else {
            form.setFieldValue(
              "field",
              form.values.field.filter((f) => f.id !== field.id),
            );
          }
        }}
      >
        <IconTrash size="1.125rem" />
      </ActionIcon>
    </Flex>
  );
}
