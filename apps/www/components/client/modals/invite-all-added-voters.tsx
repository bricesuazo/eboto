"use client";

import { api } from "@/trpc/client";
import { Alert, Button, Group, Modal, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconAlertCircle,
  IconCheck,
  IconMailForward,
} from "@tabler/icons-react";

export default function InviteAllAddedVoters({
  election_id,
  isDisabled,
}: {
  election_id: string;
  isDisabled: boolean;
}) {
  const [opened, { open, close }] = useDisclosure(false);

  // const { mutate, isLoading, isError, error } =
  //   api.election.inviteAllInvitedVoters.useMutation({
  //     onSuccess: () => {
  //       notifications.show({
  //         title: `All voters invited!`,
  //         message: "Successfully invited all voters",
  //         icon: <IconCheck size="1.1rem" />,
  //         autoClose: 5000,
  //       });
  //       close();
  //     },
  //   });

  return (
    <>
      <Button
        variant="light"
        leftSection={<IconMailForward size="1rem" />}
        onClick={open}
        disabled={isDisabled}
        // style={(theme) => ({
        //   [theme.fn.smallerThan("xs")]: {
        //     width: "100%",
        //   },
        // })}
      >
        Invite
      </Button>
      <Modal
        opened={
          opened
          // || isLoading
        }
        onClose={close}
        title={
          <Text fw={600}>Are you sure you want to invite all voters?</Text>
        }
      >
        <Stack gap="sm">
          <Text>
            This will send an email to all voters that are not yet invited and
            has status of &quot;ADDED&quot;.
          </Text>
          {/* {isError && (
            <Alert
              icon={<IconAlertCircle size="1rem" />}
              title="Error"
              color="red"
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
              // loading={isLoading}
              onClick={() =>
                api.election.inviteAllInvitedVoters.mutate({
                  election_id,
                })
              }
              // disabled={isLoading}
            >
              Invite All
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
