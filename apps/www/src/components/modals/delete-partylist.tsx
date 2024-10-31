"use client";

import { useEffect } from "react";
import { Alert, Button, Group, Mark, Modal, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconAlertCircle, IconCheck } from "@tabler/icons-react";

import type { Database } from "@eboto/supabase/types";

import { api } from "~/trpc/client";

export default function DeletePartylist({
  partylist,
}: {
  partylist: Database["public"]["Tables"]["partylists"]["Row"];
}) {
  const context = api.useUtils();
  const { mutate, isPending, isError, error, reset } =
    api.partylist.delete.useMutation({
      onSuccess: async () => {
        notifications.show({
          title: `${partylist.name} (${partylist.acronym}) deleted!`,
          message: "Successfully deleted partylist",
          icon: <IconCheck size="1.1rem" />,
          autoClose: 5000,
        });

        await context.partylist.getDashboardData.invalidate();
      },
      onError: (error) => {
        notifications.show({
          title: "Error",
          message: error.message,
          color: "red",
          autoClose: 3000,
        });
      },
      onMutate: () => close(),
    });

  const [opened, { open, close }] = useDisclosure(false);

  useEffect(() => {
    if (opened) {
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  return (
    <>
      <Button onClick={open} variant="subtle" color="red" size="compact-sm">
        Delete
      </Button>

      <Modal
        opened={opened || isPending}
        onClose={close}
        title={
          <Text fw={600}>
            Confirm Delete Partylist - {partylist.name} ({partylist.acronym})
          </Text>
        }
      >
        <Stack gap="sm">
          <Stack>
            <Text>Are you sure you want to delete this partylist?</Text>
            <Mark p="sm" color="red">
              This will also delete all the candidates under this partylist.
              Make sure you change the partylist of the candidates first.
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
              {error.message}
            </Alert>
          )}
          <Group justify="right" gap="xs">
            <Button variant="default" onClick={close} disabled={isPending}>
              Cancel
            </Button>
            <Button
              color="red"
              loading={isPending}
              onClick={() =>
                mutate({
                  partylist_id: partylist.id,
                  election_id: partylist.election_id,
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
