'use client';

import { useEffect } from 'react';
import { Alert, Button, Group, Modal, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';

import { formatName } from '@eboto/constants';

import { api } from '~/trpc/client';
import type { Database } from '../../../../../supabase/types';

export default function DeleteCandidate({
  candidate,
  name_arrangement,
}: {
  candidate: Pick<
    Database['public']['Tables']['candidates']['Row'],
    'id' | 'election_id' | 'first_name' | 'middle_name' | 'last_name'
  >;
  name_arrangement: number;
}) {
  const context = api.useUtils();
  const [opened, { open, close }] = useDisclosure(false);
  const deleteCandidateMutation = api.candidate.delete.useMutation({
    onSuccess: async () => {
      await context.candidate.getDashboardData.invalidate();
      notifications.show({
        title: `${formatName(name_arrangement, candidate, true)} deleted!`,
        message: 'Successfully deleted partylist',
        icon: <IconCheck size="1.1rem" />,
        autoClose: 5000,
      });
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
    if (opened) {
      deleteCandidateMutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  return (
    <>
      <Button
        onClick={open}
        variant="light"
        color="red"
        size="compact-sm"
        w="fit-content"
      >
        Delete
      </Button>
      <Modal
        opened={opened || deleteCandidateMutation.isPending}
        onClose={close}
        title={
          <Text fw={600}>
            Confirm Delete Candidate -{' '}
            {formatName(name_arrangement, candidate, true)}
          </Text>
        }
      >
        <Stack gap="sm">
          <Stack>
            <Text>Are you sure you want to delete this candidate?</Text>
            <Text>This action cannot be undone.</Text>
          </Stack>
          {deleteCandidateMutation.isError && (
            <Alert
              icon={<IconAlertCircle size="1rem" />}
              color="red"
              title="Error"
              variant="filled"
            >
              {deleteCandidateMutation.error.message}
            </Alert>
          )}
          <Group justify="right" gap="xs">
            <Button
              variant="default"
              onClick={close}
              disabled={deleteCandidateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              color="red"
              loading={deleteCandidateMutation.isPending}
              onClick={() =>
                deleteCandidateMutation.mutate({
                  candidate_id: candidate.id,
                  election_id: candidate.election_id,
                })
              }
              type="submit"
            >
              Confirm Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
