"use client";

import { api } from "@/trpc/client";
import { type Partylist } from "@eboto-mo/db/schema";
import { Alert, Button, Group, Mark, Modal, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconCheck } from "@tabler/icons-react";
import { IconAlertCircle } from "@tabler/icons-react";

export default function DeletePartylist({
  partylist,
}: {
  partylist: Partylist;
}) {
  // const { mutate, isLoading, isError, error, reset } =
  //   api.election.deletePartylist.useMutation({
  //     onSuccess: async () => {
  //       notifications.show({
  //         title: `${partylist.name} (${partylist.acronym}) deleted!`,
  //         message: "Successfully deleted partylist",
  //         icon: <IconCheck size="1.1rem" />,
  //         autoClose: 5000,
  //       });
  //     },
  //     onError: (error) => {
  //       notifications.show({
  //         title: "Error",
  //         message: error.message,
  //         color: "red",
  //         autoClose: 3000,
  //       });
  //     },
  //     onMutate: () => close(),
  //   });

  const [opened, { open, close }] = useDisclosure(false);
  return (
    <>
      <Button
        onClick={open}
        variant="light"
        color="red"
        size="sm"
        // compact
      >
        Delete
      </Button>

      <Modal
        opened={
          opened
          // || isLoading
        }
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
          {/* {isError && (
            <Alert
              icon={<IconAlertCircle size="1rem" />}
              color="red"
              title="Error"
              variant="filled"
            >
              {error.message}
            </Alert>
          )} */}
          <Group justify="right" gap="xs">
            <Button
              variant="default"
              onClick={close}
              // disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              color="red"
              // loading={isLoading}
              onClick={() =>
                api.election.deletePartylist.mutate({
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
