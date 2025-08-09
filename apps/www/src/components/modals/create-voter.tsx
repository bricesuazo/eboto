'use client';

import { useEffect } from 'react';
import {
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
  IconUserPlus,
} from '@tabler/icons-react';
import { zod4Resolver } from 'mantine-form-zod-resolver';

import type { CreateVoter } from '~/schema/voter';
import { CreateVoterSchema } from '~/schema/voter';
import { api } from '~/trpc/client';

export default function CreateVoter({ election_id }: { election_id: string }) {
  const context = api.useUtils();
  const [opened, { open, close }] = useDisclosure(false);

  const createSingleVoterMutation = api.voter.createSingle.useMutation({
    onSuccess: async () => {
      await context.election.getVotersByElectionSlug.invalidate();
      notifications.show({
        title: `${form.values.email} added!`,
        message: 'Successfully added voter',
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

  const form = useForm<CreateVoter>({
    initialValues: {
      email: '',
    },
    validate: zod4Resolver(CreateVoterSchema),
  });

  useEffect(() => {
    if (opened) {
      form.reset();
      createSingleVoterMutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  return (
    <>
      <Button
        leftSection={<IconUserPlus size="1rem" />}
        onClick={open}
        disabled={createSingleVoterMutation.isPending}
        // style={(theme) => ({
        //   [theme.fn.smallerThan("xs")]: {
        //     width: "100%",
        //   },
        // })}
      >
        Add voter
      </Button>

      <Modal
        opened={opened || createSingleVoterMutation.isPending}
        onClose={close}
        closeOnClickOutside={false}
        title={<Text fw={600}>Add voter</Text>}
      >
        <form
          onSubmit={form.onSubmit((value) => {
            createSingleVoterMutation.mutate({
              election_id,
              email: value.email,
            });
          })}
        >
          <Stack gap="sm">
            <TextInput
              placeholder="Enter voter's email"
              label="Email address"
              required
              disabled={createSingleVoterMutation.isPending}
              withAsterisk
              {...form.getInputProps('email')}
              leftSection={<IconAt size="1rem" />}
            />

            {createSingleVoterMutation.isError && (
              <Alert
                icon={<IconAlertCircle size="1rem" />}
                title="Error"
                color="red"
              >
                {createSingleVoterMutation.error.message}
              </Alert>
            )}
            <Group justify="right" gap="xs">
              <Button
                variant="default"
                onClick={close}
                disabled={createSingleVoterMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!form.isValid()}
                loading={createSingleVoterMutation.isPending}
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
