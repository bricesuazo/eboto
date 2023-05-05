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
import { api } from "../../utils/api";
import { type UseFormReturnType, useForm } from "@mantine/form";
import { useDidUpdate } from "@mantine/hooks";
import { IconTrash } from "@tabler/icons-react";
import type { VoterField } from "@prisma/client";

type Field = { id: string; name: string; type: "fromDb" | "fromInput" };
type FormType = { field: Field[] };

const UpdateVoterField = ({
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
  const form = useForm<FormType>({
    initialValues: {
      field: voterFields.map((field) => ({
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

  const context = api.useContext();

  const updateVoterFieldMutation = api.election.updateVoterField.useMutation({
    onSuccess: async () => {
      await context.election.getElectionVoter.invalidate();
      onClose();
    },
  });

  useDidUpdate(() => {
    if (isOpen) {
      updateVoterFieldMutation.reset();
      const data: typeof form.values.field = voterFields.map((field) => ({
        id: field.id,
        name: field.name,
        type: "fromDb",
      }));
      form.setValues({ field: data });

      form.resetDirty({ field: data });
    }
  }, [isOpen]);

  return (
    <Modal
      opened={isOpen || updateVoterFieldMutation.isLoading}
      onClose={onClose}
      title={<Text weight={600}>Voter Field</Text>}
    >
      <form
        onSubmit={form.onSubmit(() => {
          updateVoterFieldMutation.mutate({
            electionId,
            field: form.values.field,
          });
        })}
      >
        <Stack spacing="sm">
          <Flex align="end">
            <TextInput
              value="Email address"
              w="100%"
              disabled
              label="Voter field"
              withAsterisk
            />
          </Flex>

          {form.values.field.map((field) => (
            <VoterFieldInput
              key={field.id}
              form={form}
              field={field}
              electionId={electionId}
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

          <Group position="right" spacing="xs">
            <Button
              variant="default"
              onClick={onClose}
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
  );
};

export default UpdateVoterField;

const VoterFieldInput = ({
  form,
  field,
  electionId,
}: {
  form: UseFormReturnType<FormType, (values: FormType) => FormType>;
  field: Field;
  electionId: string;
}) => {
  const context = api.useContext();
  const deleteSingleVoterFieldMutation =
    api.election.deleteSingleVoterField.useMutation({
      onSuccess: async () => {
        await context.election.getElectionVoter.invalidate();
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
            })
          );
        }}
      />
      <ActionIcon
        color="red"
        variant="outline"
        size="2.25rem"
        loading={deleteSingleVoterFieldMutation.isLoading}
        loaderProps={{
          w: 18,
        }}
        onClick={async () => {
          if (field.type === "fromDb") {
            await deleteSingleVoterFieldMutation.mutateAsync({
              electionId,
              voterFieldId: field.id,
            });
          }
          form.setFieldValue(
            "field",
            form.values.field.filter((f) => f.id !== field.id)
          );
        }}
      >
        <IconTrash size="1.125rem" />
      </ActionIcon>
    </Flex>
  );
};
