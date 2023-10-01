"use client";

import { api } from "@/trpc/client";
import {
  ActionIcon,
  Alert,
  Button,
  Group,
  List,
  ListItem,
  Modal,
  Stack,
  Text,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconAlertCircle, IconCheck, IconUserMinus } from "@tabler/icons-react";

export default function DeleteBulkVoter({
  voters,
  election_id,
  isDisabled, // onSuccess,
}: {
  voters: {
    id: string;
    email: string;
    isVoter: boolean;
  }[];
  election_id: string;
  isDisabled: boolean;
  onSuccess?: () => void;
}) {
  const [opened, { open, close }] = useDisclosure();

  const { mutate, isLoading, isError, error } =
    api.election.deleteBulkVoter.useMutation({
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
        visibleFrom="sm"
        disabled={isDisabled}
      >
        <IconUserMinus size="1.25rem" />
      </ActionIcon>
      <Button
        color="red"
        variant="outline"
        onClick={open}
        leftSection={<IconUserMinus size="1.25rem" />}
        hiddenFrom="sm"
        disabled={isDisabled}
      >
        Delete selected
      </Button>

      <Modal
        opened={
          opened
          // || isLoading
        }
        onClose={close}
        title={<Text fw={600}>Confirm Delete Voter(s)</Text>}
      >
        <Stack gap="sm">
          <Text>
            Are you sure you want to delete this voter(s)? This action cannot be
            undone.
          </Text>

          <List>
            {voters.map((voter) => (
              <ListItem key={voter.id}>{voter.email}</ListItem>
            ))}
          </List>
          {isError && (
            <Alert
              icon={<IconAlertCircle size="1rem" />}
              color="red"
              title="Error"
              variant="filled"
            >
              {error.message}
            </Alert>
          )}
          <Group justify="right" gap="xs">
            <Button variant="default" onClick={close} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              color="red"
              loading={isLoading}
              onClick={() =>
                mutate({
                  election_id,
                  voters,
                })
              }
            >
              Confirm Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
