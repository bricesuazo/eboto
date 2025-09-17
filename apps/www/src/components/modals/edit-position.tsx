'use client';

import { useEffect } from 'react';
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
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconAlertCircle,
  IconCheck,
  IconLetterCase,
} from '@tabler/icons-react';
import { zod4Resolver } from 'mantine-form-zod-resolver';

import type { EditPosition } from '~/schema/position';
import { EditPositionSchema } from '~/schema/position';
import { api } from '~/trpc/client';
import type { Database } from '../../../../../supabase/types';

export default function EditPosition({
  position,
}: {
  position: Pick<
    Database['public']['Tables']['positions']['Row'],
    'id' | 'election_id' | 'name' | 'min' | 'max' | 'description'
  >;
}) {
  const [opened, { open, close }] = useDisclosure(false);
  const context = api.useUtils();

  const initialValues: EditPosition = {
    name: position.name,
    isSingle: !(position.min === 0 && position.max === 1),
    min: position.min,
    max: position.max,
  };

  const form = useForm<EditPosition>({
    initialValues,
    validateInputOnChange: true,
    validateInputOnBlur: true,
    onValuesChange: (values, prevValues) => {
      if (!values.isSingle && prevValues.isSingle) {
        form.setFieldValue('min', 0);
        form.setFieldValue('max', 1);
      }

      if (values.isSingle && !prevValues.isSingle) {
        form.resetField('min');
        form.resetField('max');
      }
    },
    validate: zod4Resolver(EditPositionSchema),
  });

  const editPositionMutation = api.position.edit.useMutation({
    onSuccess: async () => {
      await Promise.all([
        context.position.getDashboardData.refetch(),
        context.candidate.getDashboardData.refetch(),
      ]);
      notifications.show({
        title: `${form.values.name} updated!`,
        message: 'Successfully updated position',
        icon: <IconCheck size="1.1rem" />,
        autoClose: 5000,
      });
      close();
    },
    onError: (error) => {
      notifications.show({
        title: 'Error',
        message: error.message,
        color: 'red',
        autoClose: 3000,
      });
    },
  });

  useEffect(() => {
    form.validateField('min');
    form.validateField('max');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.values.min, form.values.max, form.values.isSingle]);

  useEffect(() => {
    if (opened) {
      form.setValues(initialValues);
      form.resetDirty(initialValues);
      editPositionMutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);
  return (
    <>
      <Button onClick={open} variant="subtle" size="compact-sm">
        Edit
      </Button>
      <Modal
        opened={opened || editPositionMutation.isPending}
        onClose={close}
        closeOnClickOutside={false}
        title={<Text fw={600}>Edit Position - {position.name}</Text>}
      >
        <form
          onSubmit={form.onSubmit((value) => {
            editPositionMutation.mutate({
              id: position.id,
              name: value.name,
              min: value.min,
              max: value.max,
              election_id: position.election_id,
            });
          })}
        >
          <Stack gap="sm">
            <TextInput
              placeholder="Enter position name"
              label="Name"
              required
              withAsterisk
              {...form.getInputProps('name')}
              leftSection={<IconLetterCase size="1rem" />}
              disabled={editPositionMutation.isPending}
            />

            <Checkbox
              label="Select multiple candidates?"
              description="If checked, you can select multiple candidates for this position when voting"
              {...form.getInputProps('isSingle', { type: 'checkbox' })}
              disabled={editPositionMutation.isPending}
            />

            {form.values.isSingle && (
              <Flex gap="sm">
                <NumberInput
                  {...form.getInputProps('min')}
                  placeholder="Enter minimum"
                  label="Minimum"
                  withAsterisk
                  disabled={
                    editPositionMutation.isPending || !form.values.isSingle
                  }
                  min={0}
                  required={form.values.isSingle}
                />
                <NumberInput
                  {...form.getInputProps('max')}
                  placeholder="Enter maximum"
                  label="Maximum"
                  withAsterisk
                  disabled={
                    editPositionMutation.isPending || !form.values.isSingle
                  }
                  min={1}
                  required={form.values.isSingle}
                />
              </Flex>
            )}

            {editPositionMutation.isError && (
              <Alert
                icon={<IconAlertCircle size="1rem" />}
                color="red"
                title="Error"
                variant="filled"
              >
                {editPositionMutation.error.message}
              </Alert>
            )}

            <Group justify="right" gap="xs">
              <Button
                variant="default"
                onClick={close}
                disabled={editPositionMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!form.isDirty() || !form.isValid()}
                loading={editPositionMutation.isPending}
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
