import {
  Modal,
  Button,
  Alert,
  Group,
  TextInput,
  Text,
  Stack,
  Select,
} from "@mantine/core";
import { api } from "../../utils/api";
import { notifications } from "@mantine/notifications";
import { isEmail, useForm } from "@mantine/form";
import {
  IconAlertCircle,
  IconAt,
  IconCheck,
  IconLetterCase,
} from "@tabler/icons-react";
import { useDidUpdate } from "@mantine/hooks";
import type { VoterField } from "@prisma/client";
import { useState } from "react";

const CreateVoterModal = ({
  isOpen,
  onClose,
  electionId,
  voterFields,
}: {
  electionId: string;
  isOpen: boolean;
  onClose: () => void;
  voterFields: VoterField[];
}) => {
  const [data, setData] = useState<
    {
      fieldName: string;
      values: {
        value: string;
      }[];
    }[]
  >([]);
  const context = api.useContext();
  const form = useForm<{
    email: string;
    [key: string]: string;
  }>({
    initialValues: {
      email: "",
      ...voterFields.reduce((acc, field) => {
        acc[field.name] = "";
        return acc;
      }, {} as Record<string, string>),
    },
    validateInputOnBlur: true,
    validate: {
      email: isEmail("Please enter a valid email address"),
      ...voterFields.reduce((acc, field) => {
        acc[field.name] = (value) =>
          value?.trim() === "" ? `${field.name} is required` : undefined;
        return acc;
      }, {} as Record<string, (value: string) => string | undefined>),
    },
  });

  const createVoterMutation = api.voter.createSingle.useMutation({
    onSuccess: async (data) => {
      await context.election.getElectionVoter.invalidate();
      notifications.show({
        title: `${data.email} added!`,
        message: "Successfully added voter",
        icon: <IconCheck size="1.1rem" />,
        autoClose: 5000,
      });
    },
  });

  const voterFieldsQuery = api.voter.getFields.useQuery(
    { electionId },
    {
      enabled: isOpen,
    }
  );

  useDidUpdate(() => {
    if (isOpen) {
      form.reset();
      createVoterMutation.reset();
    }
  }, [isOpen]);

  useDidUpdate(() => {
    if (voterFieldsQuery.data) {
      setData(
        voterFieldsQuery.data.map((field) => ({
          fieldName: field.fieldName,
          values: field.fields.map((value) => ({
            value: value.fieldValue,
          })),
        }))
      );
    }
  }, [voterFieldsQuery.data, isOpen]);

  return (
    <Modal
      opened={isOpen || createVoterMutation.isLoading}
      onClose={onClose}
      title={<Text weight={600}>Add voter</Text>}
    >
      <form
        onSubmit={form.onSubmit((value) => {
          void (async () => {
            await createVoterMutation.mutateAsync({
              electionId,
              email: value.email,
              fields: voterFields.map((field) => ({
                name: field.name,
                value: value[field.name] || "",
              })),
            });
            onClose();
          })();
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
            error={
              form.errors.email ||
              (createVoterMutation.error?.data?.code === "CONFLICT" &&
                createVoterMutation.error.message)
            }
          />
          {voterFields.map((field) => (
            <Select
              key={field.id}
              disabled={voterFieldsQuery.isLoading}
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
                  })
                );
                return query;
              }}
              label={field.name}
              placeholder={`Enter ${field.name}`}
              nothingFound="Nothing found"
              searchable
              creatable
              getCreateLabel={(query) => `+ Create ${query}`}
              error={
                form.errors[field.name] ||
                (createVoterMutation.error?.data?.code === "CONFLICT" &&
                  createVoterMutation.error.message)
              }
              {...form.getInputProps(field.name)}
              required
              withAsterisk
              icon={<IconLetterCase size="1rem" />}
            />
          ))}
          {createVoterMutation.isError &&
            createVoterMutation.error?.data?.code !== "CONFLICT" && (
              <Alert
                icon={<IconAlertCircle size="1rem" />}
                title="Error"
                color="red"
              >
                {createVoterMutation.error?.message}
              </Alert>
            )}
          <Group position="right" spacing="xs">
            <Button
              variant="default"
              onClick={onClose}
              disabled={createVoterMutation.isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!form.isValid()}
              loading={createVoterMutation.isLoading}
            >
              Create
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

export default CreateVoterModal;
