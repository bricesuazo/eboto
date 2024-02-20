"use client";

import { useEffect } from "react";
import Link from "next/link";
import { api } from "@/trpc/client";
import {
  Alert,
  Button,
  Group,
  Modal,
  Select,
  Stack,
  Text,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconAlertCircle } from "@tabler/icons-react";
import { useSession } from "next-auth/react";

export default function ElectionBoost() {
  const session = useSession();
  const [opened, { open, close }] = useDisclosure(false);
  const electionsQuery = api.election.getAllMyElections.useQuery(undefined, {
    enabled: session.status === "authenticated" && opened,
  });
  const context = api.useUtils();

  const createSingleVoterMutation = api.voter.createSingle.useMutation({
    onSuccess: async () => {
      await context.election.getVotersByElectionSlug.invalidate();

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

  const form = useForm<{
    election_id?: string;
  }>({
    validate: {
      election_id: (value) => {
        if (!value ?? !value?.length) {
          return "Election is required";
        }
      },
    },
  });

  useEffect(() => {
    if (opened) {
      form.reset();
      createSingleVoterMutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  return (
    <>
      {session.status === "authenticated" ? (
        <Button
          size="lg"
          radius="xl"
          variant="gradient"
          w="100%"
          onClick={open}
          disabled={createSingleVoterMutation.isPending}
        >
          Get Boost
        </Button>
      ) : (
        <Button
          size="lg"
          radius="xl"
          variant="gradient"
          w="100%"
          disabled={createSingleVoterMutation.isPending}
          component={Link}
          href="/sign-in"
        >
          Get Boost
        </Button>
      )}

      <Modal
        opened={opened || createSingleVoterMutation.isPending}
        onClose={close}
        title={<Text fw={600}>Get Your Election Boosted!</Text>}
      >
        <form
          onSubmit={form.onSubmit((value) => {
            console.log("🚀 ~ onSubmit={form.onSubmit ~ value:", value);
          })}
        >
          <Stack gap="sm">
            <Select
              label="Election"
              placeholder="Select election"
              withAsterisk
              data={
                electionsQuery.data?.map(({ election }) => ({
                  value: election.id,
                  label: election.name,
                })) ?? []
              }
              disabled={electionsQuery.isLoading}
            />

            {createSingleVoterMutation.isError && (
              <Alert
                icon={<IconAlertCircle size="1rem" />}
                title="Error"
                color="red"
              >
                {createSingleVoterMutation.error.message}
              </Alert>
            )}
            <Group justify="right" gap="xs">
              <Button
                variant="default"
                onClick={close}
                disabled={createSingleVoterMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!form.isValid()}
                loading={createSingleVoterMutation.isPending}
              >
                Create
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
