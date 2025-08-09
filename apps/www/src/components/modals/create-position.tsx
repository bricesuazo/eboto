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
  IconReplace,
} from '@tabler/icons-react';
import { zod4Resolver } from 'mantine-form-zod-resolver';

import type { CreatePosition } from '~/schema/position';
import { CreatePositionSchema } from '~/schema/position';
import { api } from '~/trpc/client';

export default function CreatePosition({
  election_id,
}: {
  election_id: string;
}) {
  const context = api.useUtils();
  const { mutate, isPending, isError, error, reset } =
    api.position.create.useMutation({
      onSuccess: async () => {
        await Promise.all([
          context.position.getDashboardData.refetch(),
          context.candidate.getDashboardData.refetch(),
        ]);
        notifications.show({
          title: `${form.values.name} created!`,
          message: 'Successfully created position',
          icon: <IconCheck size="1.1rem" />,
          autoClose: 5000,
        });
        close();
      },
    });

  const [opened, { open, close }] = useDisclosure(false);
  const form = useForm<CreatePosition>({
    initialValues: {
      name: '',
      isSingle: false,
      min: 0,
      max: 1,
    },
    validate: zod4Resolver(CreatePositionSchema),
  });

  useEffect(() => {
    if (opened) {
      form.reset();
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  useEffect(() => {
    if (!form.values.isSingle) {
      form.setValues({
        min: 0,
        max: 1,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.values.isSingle]);
  return (
    <>
      <Button
        style={() => ({
          width: 'fit-content',
        })}
        onClick={open}
        leftSection={<IconReplace size="1rem" />}
      >
        Add position
      </Button>
      <Modal
        opened={opened || isPending}
        onClose={close}
        closeOnClickOutside={false}
        title={<Text fw={600}>Create position</Text>}
      >
        <form
          onSubmit={form.onSubmit((value) => {
            mutate({
              name: value.name,
              election_id,
              min: form.values.isSingle ? value.min : undefined,
              max: form.values.isSingle ? value.max : undefined,
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
                  disabled={isPending}
                  min={0}
                  required={form.values.isSingle}
                />
                <NumberInput
                  {...form.getInputProps('max')}
                  placeholder="Enter maximum"
                  label="Maximum"
                  withAsterisk
                  disabled={isPending}
                  min={1}
                  required={form.values.isSingle}
                />
              </Flex>
            )}

            {isError && (
              <Alert
                icon={<IconAlertCircle size="1rem" />}
                title="Error"
                color="red"
              >
                {error.message}
              </Alert>
            )}
            <Group justify="right" gap="xs">
              <Button variant="default" onClick={close} disabled={isPending}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!form.isValid()}
                loading={isPending}
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
