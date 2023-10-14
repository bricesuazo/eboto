"use client";

import { useEffect } from "react";
import { api } from "@/trpc/client";
import {
  ActionIcon,
  Alert,
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
import { notifications } from "@mantine/notifications";
import {
  IconAlertCircle,
  IconCheck,
  IconTrash,
  IconUsersGroup,
} from "@tabler/icons-react";

import type { Election, VoterField } from "@eboto-mo/db/schema";

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
  isDisabled,
}: {
  election: Election & { voter_fields: VoterField[] };
  isDisabled: boolean;
}) {
  const getAllVoterFieldQuery = api.voter.getAllVoterField.useQuery(
    {
      election_id: election.id,
    },
    {
      initialData: election.voter_fields,
    },
  );
  const [opened, { open, close }] = useDisclosure(false);

  const updateVoterFieldMutation = api.voter.updateVoterField.useMutation({
    onSuccess: async () => {
      notifications.show({
        title: ``,
        message: "Voter field updated successfully",
        icon: <IconCheck size="1.1rem" />,
        autoClose: 5000,
      });
      close();
      await getAllVoterFieldQuery.refetch();
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

  const form = useForm<FormType>({
    initialValues: {
      field: getAllVoterFieldQuery.data.map((field) => ({
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
      updateVoterFieldMutation.reset();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  return (
    <>
      <Button
        variant="light"
        leftSection={<IconUsersGroup size="1rem" />}
        onClick={open}
        disabled={isDisabled || true}
        // style={(theme) => ({
        //   [theme.fn.smallerThan("xs")]: {
        //     width: "100%",
        //   },
        // })}
      >
        Group
      </Button>

      <Modal
        opened={opened || updateVoterFieldMutation.isLoading}
        onClose={close}
        title={<Text fw={600}>Voter Field</Text>}
      >
        <form
          onSubmit={form.onSubmit((values) => {
            updateVoterFieldMutation.mutate({
              election_id: election.id,
              fields: values.field,
            });
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

            {updateVoterFieldMutation.isError && (
              <Alert
                icon={<IconAlertCircle size="1rem" />}
                color="red"
                title="Error"
                variant="filled"
              >
                {updateVoterFieldMutation.error.message}
              </Alert>
            )}

            <Group justify="right" gap="xs">
              <Button
                variant="default"
                onClick={close}
                disabled={updateVoterFieldMutation.isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={updateVoterFieldMutation.isLoading}
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
  const context = api.useContext();
  const { mutate, isLoading } = api.voter.deleteSingleVoterField.useMutation({
    onSuccess: async () => {
      await context.voter.getAllVoterField.invalidate();
    },
  });

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
        loading={isLoading}
        loaderProps={{
          w: 18,
        }}
        onClick={() => {
          if (field.type === "fromDb") {
            mutate({
              election_id,
              field_id: field.id,
            });
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
