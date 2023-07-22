'use client';

import { deleteBulkVoter } from '@/actions';
import {
  ActionIcon,
  Alert,
  Button,
  Group,
  List,
  Modal,
  Stack,
  Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconAlertCircle,
  IconCheck,
  IconUpload,
  IconUserMinus,
} from '@tabler/icons-react';
import { useMutation } from '@tanstack/react-query';

export default function DeleteBulkVoter({
  voters,
  election_id,
  isDisabled,
}: {
  voters: {
    id: string;
    email: string;
  }[];
  election_id: string;
  isDisabled: boolean;
}) {
  const [opened, { open, close }] = useDisclosure();

  const { mutate, isLoading, isError, error } = useMutation({
    mutationFn: () => deleteBulkVoter({ election_id, voters }),
    onSuccess: ({ count }) => {
      notifications.show({
        title: `${count} voter(s) successfully deleted!`,
        message: `Successfully deleted voters`,
        icon: <IconCheck size="1.1rem" />,
        autoClose: 5000,
      });
      close();
    },
  });

  return (
    <>
      <ActionIcon
        color="red"
        onClick={open}
        size="lg"
        variant="outline"
        sx={(theme) => ({
          [theme.fn.largerThan('xs')]: {
            display: 'none',
          },
        })}
        disabled={isDisabled}
      >
        <IconUserMinus size="1.25rem" />
      </ActionIcon>
      <Button
        color="red"
        variant="outline"
        onClick={open}
        leftIcon={<IconUserMinus size="1.25rem" />}
        sx={(theme) => ({
          [theme.fn.smallerThan('xs')]: {
            display: 'none',
          },
        })}
        disabled={isDisabled}
      >
        Delete selected
      </Button>

      <Modal
        opened={opened || isLoading}
        onClose={close}
        title={<Text weight={600}>Confirm Delete Voter(s)</Text>}
      >
        <Stack spacing="sm">
          <Text>
            Are you sure you want to delete this voter(s)? This action cannot be
            undone.
          </Text>

          <List>
            {voters.map((voter) => (
              <List.Item key={voter.id}>{voter.email}</List.Item>
            ))}
          </List>
          {isError && (
            <Alert
              icon={<IconAlertCircle size="1rem" />}
              color="red"
              title="Error"
              variant="filled"
            >
              {(error as Error)?.message}
            </Alert>
          )}
          <Group position="right" spacing="xs">
            <Button variant="default" onClick={close} disabled={isLoading}>
              Cancel
            </Button>
            <Button color="red" loading={isLoading} onClick={() => mutate()}>
              Confirm Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
