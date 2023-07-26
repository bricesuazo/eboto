"use client";

import { api } from "@/trpc/client";
import {
  Button,
  Checkbox, // Flex,
  Group,
  Modal, // NumberInput,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { hasLength, useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { IconLetterCase, IconReplace } from "@tabler/icons-react";
import { useEffect } from "react";

export default function CreatePosition({
  election_id,
  order,
}: {
  election_id: string;
  order: number;
}) {
  // const { mutate, isLoading, isError, error, reset } =
  //   api.election.createPosition.useMutation({
  //     onSuccess: async () => {
  //       notifications.show({
  //         title: `${form.values.name} created!`,
  //         message: "Successfully created position",
  //         icon: <IconCheck size="1.1rem" />,
  //         autoClose: 5000,
  //       });
  //       close();
  //     },
  //   });

  const [opened, { open, close }] = useDisclosure(false);
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
        "Name must be between 3 and 50 characters",
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

  useEffect(() => {
    if (opened) {
      form.reset();
      // reset();
    }
  }, [opened]);

  useEffect(() => {
    if (!form.values.isSingle) {
      form.setValues({
        min: 0,
        max: 1,
      });
    }
  }, [form.values.isSingle]);
  return (
    <>
      <Button
        style={() => ({
          width: "fit-content",
          // [theme.fn.smallerThan("xs")]: { width: "100%" },
        })}
        onClick={open}
        leftSection={<IconReplace size="1rem" />}
      >
        Add position
      </Button>
      <Modal
        opened={
          opened
          // || isLoading
        }
        onClose={close}
        title={<Text fw={600}>Create position</Text>}
      >
        <form
          onSubmit={form.onSubmit((value) => {
            void (async () => {
              await api.election.createPosition.mutate({
                name: value.name,
                election_id,
                order,
                min: form.values.isSingle ? value.min : undefined,
                max: form.values.isSingle ? value.max : undefined,
              });
            })();
          })}
        >
          <Stack gap="sm">
            <TextInput
              placeholder="Enter position name"
              label="Name"
              required
              withAsterisk
              {...form.getInputProps("name")}
              leftSection={<IconLetterCase size="1rem" />}
            />
            <Checkbox
              label="Select multiple candidates?"
              description="If checked, you can select multiple candidates for this position when voting"
              {...form.getInputProps("isSingle", { type: "checkbox" })}
            />

            {/* {form.values.isSingle && (
              <Group gap="sm">
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
              </Group>
            )} */}

            {/* {isError && (
              <Alert
                icon={<IconAlertCircle size="1rem" />}
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
