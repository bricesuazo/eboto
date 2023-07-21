"use client";

import { deleteCandidate } from "@/actions";
import { type Candidate } from "@eboto-mo/db/schema";
import { Alert, Button, Group, Modal, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconAlertCircle, IconCheck } from "@tabler/icons-react";
import { useMutation } from "@tanstack/react-query";

export default function DeleteCandidate({
  candidate,
}: {
  candidate: Candidate;
}) {
  const [opened, { open, close }] = useDisclosure(false);
  const { mutate, isLoading, isError, error, reset } = useMutation({
    mutationFn: (id: string) => deleteCandidate(id),
    onSuccess: async () => {
      notifications.show({
        title: `${candidate.first_name}${
          candidate.middle_name && ` ${candidate.middle_name}`
        } ${candidate.last_name} deleted!`,
        message: "Successfully deleted partylist",
        icon: <IconCheck size="1.1rem" />,
        autoClose: 5000,
      });
    },
    onError: (error) => {
      notifications.show({
        title: "Error",
        message: (error as Error)?.message,
        color: "red",
        autoClose: 3000,
      });
    },
  });
  return (
    <>
      <Button
        onClick={open}
        variant="light"
        color="red"
        compact
        size="sm"
        w="fit-content"
      >
        Delete
      </Button>
      <Modal
        opened={opened || isLoading}
        onClose={close}
        title={
          <Text weight={600}>
            Confirm Delete Candidate - {candidate.first_name}{" "}
            {candidate.last_name}
            {candidate.middle_name ? ` ${candidate.middle_name}` : ""}
          </Text>
        }
      >
        <Stack spacing="sm">
          <Stack>
            <Text>Are you sure you want to delete this candidate?</Text>
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
              onClick={() => mutate(candidate.id)}
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
