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

const EditVoterModal = ({
  isOpen,
  onClose,
  electionId,
  voter,
  voterFields,
}: {
  electionId: string;
  isOpen: boolean;
  onClose: () => void;
  voter: {
    id: string;
    field: { [key: string]: string | undefined };
    email: string;
    accountStatus: "ACCEPTED" | "INVITED" | "DECLINED" | "ADDED";
  };
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
    field: {
      [key: string]: string | undefined;
    };
  }>({
    initialValues: {
      email: voter.email,
      field: voter.field,
    },
    validateInputOnBlur: true,
    validate: {
      email: isEmail("Please enter a valid email address"),
      field: voterFields.reduce((acc, field) => {
        acc[field.name] = (value) =>
          value === undefined || value.trim() === ""
            ? `${field.name} is required`
            : undefined;
        return acc;
      }, {} as Record<string, (value: string | undefined) => string | undefined>),
    },
  });

  const voterFieldsQuery = api.voter.getFields.useQuery(
    { electionId },
    {
      enabled: isOpen,
    }
  );

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

  const editVoterMutation = api.voter.editSingle.useMutation({
    onSuccess: async (data) => {
      await context.election.getElectionVoter.invalidate();

      notifications.show({
        title: `${
          data.type === "voter"
            ? data.voter.user.email
            : data.invitedVoter.email
        } updated!`,
        message: "Successfully updated voter!",
        icon: <IconCheck size="1.1rem" />,
        autoClose: 5000,
      });
    },
  });

  useDidUpdate(() => {
    if (isOpen) {
      editVoterMutation.reset();

      const dataForForm: typeof form.values = {
        email: voter.email,
        field: voter.field,
      };

      form.setValues(dataForForm);
      form.resetDirty(dataForForm);
    }
  }, [isOpen]);

  return (
    <Modal
      opened={isOpen || editVoterMutation.isLoading}
      onClose={onClose}
      title={<Text weight={600}>Edit voter - {voter.email}</Text>}
    >
      <form
        onSubmit={form.onSubmit((value) => {
          void (async () => {
            await editVoterMutation.mutateAsync({
              electionId,
              voterId: voter.id,
              field: Object.entries(value.field).reduce((acc, [key, value]) => {
                if (value !== undefined) {
                  acc[key] = value;
                } else {
                  acc[key] = "";
                }
                return acc;
              }, {} as Record<string, string>),
              voterEmail: value.email,
              accountStatus: voter.accountStatus,
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
            disabled={voter.accountStatus !== "ADDED"}
            description={
              voter.accountStatus !== "ADDED" &&
              "You can only edit the email address of a voter if they have not yet accepted their invitation."
            }
            error={
              form.errors.email ||
              (editVoterMutation.error?.data?.code === "CONFLICT" &&
                editVoterMutation.error.message)
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
              withinPortal
              getCreateLabel={(query) => `+ Create ${query}`}
              error={
                form.errors[["field", field.name].join(".")] ||
                (editVoterMutation.error?.data?.code === "CONFLICT" &&
                  editVoterMutation.error.message)
              }
              {...form.getInputProps(["field", field.name].join("."))}
              required
              withAsterisk
              icon={<IconLetterCase size="1rem" />}
            />
          ))}

          {editVoterMutation.isError &&
            editVoterMutation.error?.data?.code !== "CONFLICT" && (
              <Alert
                icon={<IconAlertCircle size="1rem" />}
                title="Error"
                color="red"
              >
                {editVoterMutation.error?.message}
              </Alert>
            )}
          <Group position="right" spacing="xs">
            <Button
              variant="default"
              onClick={onClose}
              disabled={editVoterMutation.isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!form.isValid() || !form.isDirty()}
              loading={editVoterMutation.isLoading}
            >
              Update
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

export default EditVoterModal;
