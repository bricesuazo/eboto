"use client";

import { useEffect } from "react";
import { api } from "@/trpc/client";
import { Alert, Button, Group, Modal, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconAlertCircle, IconCheck } from "@tabler/icons-react";



import type { Candidate } from "@eboto-mo/db/schema";





export default function DeleteCandidate({
  candidate,
}: {
  candidate: Candidate;
}) {
  const [opened, { open, close }] = useDisclosure(false);
  const { mutate, isLoading, isError, error, reset } =
    api.election.deleteCandidate.useMutation({
      onSuccess: () => {
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
          message: error.message,
          color: "red",
          autoClose: 3000,
        });
      },
    });

  useEffect(() => {
    if (opened) {
      reset();
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
        opened={opened || isLoading}
        onClose={close}
        title={
          <Text fw={600}>
            Confirm Delete Candidate - {candidate.first_name}{" "}
            {candidate.last_name}
            {candidate.middle_name ? ` ${candidate.middle_name}` : ""}
          </Text>
        }
      >
        <Stack gap="sm">
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