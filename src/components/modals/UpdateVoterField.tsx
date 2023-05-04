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
import { useForm } from "@mantine/form";
import { useDidUpdate } from "@mantine/hooks";
import { IconTrash } from "@tabler/icons-react";

const UpdateVoterField = ({
  isOpen,
  onClose,
  electionId,
}: {
  electionId: string;
  isOpen: boolean;
  onClose: () => void;
}) => {
  const form = useForm<{
    field: {
      id: string;
      name: string;
    }[];
  }>({
    initialValues: {
      field: [],
    },
    validate: {
      field: (value) => {
        if (value.length === 0) return "At least one field is required";

        if (value.some((field) => field.name.trim() === ""))
          return "Field name is required";
      },
    },
  });

  const updateVoterFieldMutation = api.election.updateVoterField.useMutation({
    onSuccess: () => {
      onClose();
    },
  });

  useDidUpdate(() => {
    if (isOpen) {
      form.reset();
      updateVoterFieldMutation.reset();
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
            <Flex gap="xs" key={field.id} align="end">
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
                onClick={() => {
                  form.setFieldValue(
                    "field",
                    form.values.field.filter((f) => f.id !== field.id)
                  );
                }}
              >
                <IconTrash size="1.125rem" />
              </ActionIcon>
            </Flex>
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
              loading={updateVoterFieldMutation.isLoading}
              disabled={!form.isValid()}
              onClick={() =>
                updateVoterFieldMutation.mutate({
                  electionId,
                  field: [],
                })
              }
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
