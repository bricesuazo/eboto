"use client";

import { deleteBulkVoter } from "@/actions";
import { Alert, Button, Group, List, Modal, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconAlertCircle, IconCheck, IconUpload } from "@tabler/icons-react";
import { useMutation } from "@tanstack/react-query";

export default function DeleteBulkVoter({
  voters,
  election_id,
}: {
  voters: {
    id: string;
    email: string;
  }[];
  election_id: string;
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
      <Button
        onClick={open}
        leftIcon={<IconUpload size="1rem" />}
        variant="light"
        sx={(theme) => ({
          [theme.fn.smallerThan("xs")]: {
            width: "100%",
          },
        })}
      >
        Import
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
