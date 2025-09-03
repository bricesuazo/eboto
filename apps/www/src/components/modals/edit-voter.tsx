'use client';

import { useEffect } from 'react';
import {
  ActionIcon,
  Alert,
  Button,
  Group,
  Modal,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconAlertCircle,
  IconAt,
  IconCheck,
  IconEdit,
  IconLetterCase,
} from '@tabler/icons-react';
import { zod4Resolver } from 'mantine-form-zod-resolver';

import type { EditVoter } from '~/schema/voter';
import { EditVoterSchema } from '~/schema/voter';
import { api } from '~/trpc/client';
import type { Database } from '../../../../../supabase/types';

export default function EditVoter({
  election_id,
  voter,
  voter_fields,
}: {
  election_id: string;
  voter: {
    id: string;
    email: string;
    field: Record<string, string> | null;
  };
  voter_fields: Database['public']['Tables']['voter_fields']['Row'][];
}) {
  const context = api.useUtils();
  const [opened, { open, close }] = useDisclosure(false);

  const initialValues: EditVoter = {
    email: voter.email,
    voter_fields: Object.fromEntries(
      voter_fields.map((field) => [field.id, voter.field?.[field.id] ?? '']),
    ),
  };

  const form = useForm<EditVoter>({
    initialValues,
    validate: zod4Resolver(EditVoterSchema),
  });

  const editVoterMutation = api.voter.edit.useMutation({
    onSuccess: async () => {
      await context.election.getVotersByElectionSlug.invalidate();
      notifications.show({
        title: 'Success',
        message: 'Successfully updated voter!',
        icon: <IconCheck size="1.1rem" />,
        autoClose: 5000,
      });
      close();
    },
  });

  useEffect(() => {
    if (opened) {
      form.setValues(initialValues);
      form.resetDirty(initialValues);
      editVoterMutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  return (
    <>
      <ActionIcon variant="outline" onClick={open}>
        <IconEdit size="1rem" />
      </ActionIcon>
      <Modal
        opened={opened || editVoterMutation.isPending}
        onClose={close}
        title={<Text fw={600}>Edit voter - {voter.email}</Text>}
      >
        <form
          onSubmit={form.onSubmit((values) => {
            editVoterMutation.mutate({
              id: voter.id,
              election_id,
              email: values.email,
              voter_fields: voter_fields.map((field) => ({
                id: field.id,
                value: values.voter_fields[field.id],
              })),
            });
          })}
        >
          <Stack gap="sm">
            <TextInput
              placeholder="Enter voter's email"
              label="Email address"
              required
              withAsterisk
              {...form.getInputProps('email')}
              leftSection={<IconAt size="1rem" />}
              disabled={editVoterMutation.isPending}
              description={
                'You can only edit the email address of a voter if they have not yet accepted their invitation.'
              }
            />

            {voter_fields
              .sort(
                (a, b) =>
                  new Date(a.created_at).getTime() -
                  new Date(b.created_at).getTime(),
              )
              .map((field) => (
                <TextInput
                  key={field.id}
                  placeholder={`Enter voter's ${field.name}`}
                  leftSection={<IconLetterCase size="1rem" />}
                  label={field.name}
                  {...form.getInputProps(`voter_fields.${field.id}`)}
                  disabled={editVoterMutation.isPending}
                />
              ))}

            {editVoterMutation.isError && (
              <Alert
                icon={<IconAlertCircle size="1rem" />}
                title="Error"
                color="red"
              >
                {editVoterMutation.error.message}
              </Alert>
            )}
            <Group justify="right" gap="xs">
              <Button
                variant="default"
                onClick={close}
                disabled={editVoterMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!form.isValid() || !form.isDirty()}
                loading={editVoterMutation.isPending}
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
