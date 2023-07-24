"use client";

import { api } from "@/lib/api/api";
import {
  ActionIcon,
  Alert,
  Button,
  Group,
  Modal,
  Stack,
  Text,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconAlertCircle, IconCheck, IconTrash } from "@tabler/icons-react";

export default function DeleteVoter({
  voter,
  election_id,
}: {
  voter: {
    id: string;
    email: string;
    account_status: "ACCEPTED" | "INVITED" | "DECLINED" | "ADDED";
  };
  election_id: string;
}) {
  const [opened, { open, close }] = useDisclosure(false);

  const { mutate, isLoading, isError, error, reset } =
    api.election.deleteVoter.useMutation({
      onSuccess: () => {
        notifications.show({
          title: "Success!",
          message: `Successfully deleted ${voter.email}`,
          icon: <IconCheck size="1.1rem" />,
          autoClose: 5000,
        });
        close();
      },
      onError: (error) => {
        notifications.show({
          title: "Error",
          message: error.message,
          color: "red",
          autoClose: 3000,
        });
      },
    });
  return (
    <>
      <ActionIcon
        color="red"
        onClick={() => {
          open();
        }}
      >
        <IconTrash size="1.25rem" />
      </ActionIcon>
      <Modal
        opened={opened || isLoading}
        onClose={close}
        title={<Text weight={600}>Confirm Delete Voter - {voter.email}</Text>}
      >
        <Stack spacing="sm">
          <Stack>
            <Text>Are you sure you want to delete this voter?</Text>
            <Text>This action cannot be undone.</Text>
          </Stack>
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
          <Group position="right" spacing="xs">
            <Button variant="default" onClick={close} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              color="red"
              loading={isLoading}
              onClick={() =>
                mutate({
                  election_id,
                  id: voter.id,
                  is_invited_voter:
                    voter.account_status !== "ACCEPTED" ? true : false,
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