'use client';

import { deletePosition } from '@/actions';
import { type Position } from '@eboto-mo/db/schema';
import { Alert, Button, Group, Mark, Modal, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { useMutation } from '@tanstack/react-query';

export default function DeletePosition({ position }: { position: Position }) {
  const [opened, { open, close }] = useDisclosure(false);

  const { mutate, isLoading, isError, error, reset } = useMutation({
    mutationFn: (id: string) => deletePosition(id),
    onSuccess: async () => {
      notifications.show({
        title: `${position.name} deleted!`,
        message: 'Successfully deleted position',
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
  return (
    <>
      <Button onClick={open} variant="light" color="red" size="sm" compact>
        Delete
      </Button>
      <Modal
        opened={opened || isLoading}
        onClose={close}
        title={
          <Text weight={600}>Confirm Delete Position - {position.name}</Text>
        }
      >
        <Stack spacing="sm">
          <Stack>
            <Text>Are you sure you want to delete this position?</Text>
            <Mark p="sm" color="red">
              This will also delete all the candidates under this position. Make
              sure you change the position of the candidates first.
            </Mark>
            <Text>This action cannot be undone.</Text>
          </Stack>
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
            <Button
              color="red"
              loading={isLoading}
              onClick={() => mutate(position.id)}
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
