"use client";

import { inviteAllInvitedVoters } from "@/actions";
import { Button, Group, Modal, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconMailForward } from "@tabler/icons-react";
import { useMutation } from "@tanstack/react-query";

export default function InviteAllInvitedVoters({
  election_id,
}: {
  election_id: string;
}) {
  const [opened, { open, close }] = useDisclosure(false);

  const { mutate, isLoading, isError, error } = useMutation({
    mutationFn: () => inviteAllInvitedVoters({ election_id }),
    onSuccess: () => {
      notifications.show({
        title: `All voters invited!`,
        message: "Successfully invited all voters",
        icon: <IconCheck size="1.1rem" />,
        autoClose: 5000,
      });
      close();
    },
  });

  return (
    <>
      <Button
        variant="light"
        leftIcon={<IconMailForward size="1rem" />}
        onClick={open}
        sx={(theme) => ({
          [theme.fn.smallerThan("xs")]: {
            width: "100%",
          },
        })}
      >
        Invite
      </Button>
      <Modal
        opened={opened || isLoading}
        onClose={close}
        title={
          <Text weight={600}>Are you sure you want to invite all voters?</Text>
        }
      >
        <Stack spacing="sm">
          <Text>
            This will send an email to all voters that are not yet invited and
            has status of &quot;ADDED&quot;.
          </Text>
          <Group position="right" spacing="xs">
            <Button variant="default" onClick={close} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              loading={isLoading}
              onClick={() => mutate()}
              disabled={isLoading}
            >
              Invite All
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
