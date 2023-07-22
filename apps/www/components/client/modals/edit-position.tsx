'use client';

import { editPartylist, editPosition } from '@/actions';
import { EditPartylistSchema, EditPositionSchema } from '@/utils/zod-schema';
import { type Position } from '@eboto-mo/db/schema';
import {
  Alert,
  Button,
  Checkbox,
  Flex,
  Group,
  Modal,
  NumberInput,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { hasLength, useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconLetterCase } from '@tabler/icons-react';
import { useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';

export default function EditPosition({
  position,
  order,
}: {
  position: Position;
  order: number;
}) {
  const [opened, { open, close }] = useDisclosure(false);

  const form = useForm({
    initialValues: {
      name: position.name,
      isSingle: !(position.min === 0 && position.max === 1),
      min: position.min,
      max: position.max,
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
        'Name must be between 3 and 50 characters',
      ),
      min: (value, values) => {
        if (value >= values.max) {
          return 'Minimum must be less than maximum';
        }
      },
      max: (value, values) => {
        if (value < form.values.min) {
          return 'Maximum must be greater than minimum';
        }

        if (values.isSingle && value === 1) {
          return 'Maximum must be greater than 1';
        }

        if (value < values.min) {
          return 'Maximum must be greater than minimum';
        }
      },
    },
  });

  const { mutate, isLoading, isError, error, reset } = useMutation({
    mutationFn: (editPositionInput: EditPositionSchema) =>
      editPosition({
        id: position.id,
        election_id: position.election_id,
        name: editPositionInput.name,
        description: editPositionInput.description,
        order: position.order,
      }),
    onSuccess: async (_, { name }) => {
      notifications.show({
        title: `${name} updated!`,
        message: 'Successfully updated position',
        icon: <IconCheck size="1.1rem" />,
        autoClose: 5000,
      });
      close();
    },
    onError: (error) => {
      notifications.show({
        title: 'Error',
        message: (error as Error)?.message,
        color: 'red',
        autoClose: 3000,
      });
    },
  });

  useEffect(() => {
    if (opened) {
      form.resetDirty();
      reset();
    }
  }, [opened]);
  return (
    <>
      <Button onClick={open} variant="light" size="sm" compact>
        Edit
      </Button>
      <Modal
        opened={opened || isLoading}
        onClose={close}
        title={<Text weight={600}>Edit Position - {position.name}</Text>}
      >
        <form
          onSubmit={form.onSubmit((value) => {
            mutate({
              id: position.id,
              name: value.name,
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
              {...form.getInputProps('name')}
              icon={<IconLetterCase size="1rem" />}
            />

            <Checkbox
              label="Select multiple candidates?"
              description="If checked, you can select multiple candidates for this position when voting"
              {...form.getInputProps('isSingle', { type: 'checkbox' })}
            />

            {form.values.isSingle && (
              <Flex gap="sm">
                <NumberInput
                  {...form.getInputProps('min')}
                  placeholder="Enter minimum"
                  label="Minimum"
                  withAsterisk
                  min={0}
                  required={form.values.isSingle}
                />
                <NumberInput
                  {...form.getInputProps('max')}
                  placeholder="Enter maximum"
                  label="Maximum"
                  withAsterisk
                  min={1}
                  required={form.values.isSingle}
                />
              </Flex>
            )}

            {isError && (
              <Alert color="red" title="Error">
                {(error as Error)?.message}
              </Alert>
            )}

            <Group position="right" spacing="xs">
              <Button variant="default" onClick={close} disabled={isLoading}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!form.isDirty() || !form.isValid()}
                loading={isLoading}
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
