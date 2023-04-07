import {
  Modal,
  TextInput,
  Button,
  Alert,
  Group,
  Text,
  Stack,
  Checkbox,
  NumberInput,
  Flex,
} from "@mantine/core";
import { api } from "../../utils/api";
import { notifications } from "@mantine/notifications";
import {
  IconAlertCircle,
  IconCheck,
  IconLetterCase,
} from "@tabler/icons-react";
import { hasLength, useForm } from "@mantine/form";
import { useDidUpdate } from "@mantine/hooks";

const CreatePositionModal = ({
  isOpen,
  onClose,
  electionId,
  order,
}: {
  isOpen: boolean;
  onClose: () => void;
  electionId: string;
  order: number;
}) => {
  const context = api.useContext();
  const form = useForm({
    initialValues: {
      name: "",
      isSingle: false,
      min: 0,
      max: 1,
    },
    validateInputOnBlur: true,
    validateInputOnChange: true,
    clearInputErrorOnChange: true,
    validate: {
      name: hasLength(
        {
          min: 3,
          max: 50,
        },
        "Name must be between 3 and 50 characters"
      ),
      min: (value, values) => {
        if (value >= values.max) {
          return "Minimum must be less than maximum";
        }
      },
      max: (value, values) => {
        if (value < form.values.min) {
          return "Maximum must be greater than minimum";
        }

        if (values.isSingle && value === 1) {
          return "Maximum must be greater than 1";
        }

        if (value < values.min) {
          return "Maximum must be greater than minimum";
        }
      },
    },
  });

  const createPositionMutation = api.position.createSingle.useMutation({
    onSuccess: async (data) => {
      await context.position.getAll.invalidate();
      notifications.show({
        title: `${data.name} created!`,
        message: "Successfully created position",
        icon: <IconCheck size="1.1rem" />,
        autoClose: 5000,
      });
      onClose();
    },
  });

  useDidUpdate(() => {
    if (isOpen) {
      form.reset();
      createPositionMutation.reset();
    }
  }, [isOpen]);

  useDidUpdate(() => {
    if (!form.values.isSingle) {
      form.setValues({
        min: 0,
        max: 1,
      });
    }
  }, [form.values.isSingle]);

  return (
    <Modal
      opened={isOpen || createPositionMutation.isLoading}
      onClose={onClose}
      title={<Text weight={600}>Create position</Text>}
    >
      <form
        onSubmit={form.onSubmit((value) => {
          createPositionMutation.mutate({
            name: value.name,
            electionId,
            order,
            min: value.isSingle ? value.min : undefined,
            max: value.isSingle ? value.max : undefined,
          });
        })}
      >
        <Stack spacing="sm">
          <TextInput
            placeholder="Enter position name"
            label="Name"
            required
            withAsterisk
            {...form.getInputProps("name")}
            icon={<IconLetterCase size="1rem" />}
          />
          <Checkbox
            label="Select multiple candidates?"
            description="If checked, you can select multiple candidates for this position when voting"
            {...form.getInputProps("isSingle", { type: "checkbox" })}
          />

          {form.values.isSingle && (
            <Flex gap="sm">
              <NumberInput
                {...form.getInputProps("min")}
                placeholder="Enter minimum"
                label="Minimum"
                withAsterisk
                min={0}
                required={form.values.isSingle}
              />
              <NumberInput
                {...form.getInputProps("max")}
                placeholder="Enter maximum"
                label="Maximum"
                withAsterisk
                min={1}
                required={form.values.isSingle}
              />
            </Flex>
          )}

          {createPositionMutation.isError &&
            createPositionMutation.error?.data?.code !== "CONFLICT" && (
              <Alert
                icon={<IconAlertCircle size="1rem" />}
                title="Error"
                color="red"
              >
                {createPositionMutation.error?.message}
              </Alert>
            )}
          <Group position="right" spacing="xs">
            <Button
              variant="default"
              onClick={onClose}
              disabled={createPositionMutation.isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!form.isValid()}
              loading={createPositionMutation.isLoading}
            >
              Create
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

export default CreatePositionModal;
