"use client";

import { api } from "@/trpc/client";
import { Button, Group, Modal, Stack, Text, TextInput } from "@mantine/core";
import { hasLength, useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { IconFlag, IconLetterCase } from "@tabler/icons-react";
import { useEffect } from "react";

export default function CreatePartylist({
  election_id,
}: {
  election_id: string;
}) {
  const [opened, { open, close }] = useDisclosure(false);

  const form = useForm({
    initialValues: {
      name: "",
      acronym: "",
    },
    validateInputOnBlur: true,
    validate: {
      name: hasLength(
        {
          min: 3,
          max: 100,
        },
        "Name must be between 3 and 100 characters",
      ),
      acronym: hasLength(
        {
          min: 1,
          max: 24,
        },
        "Acronym must be between 1 and 24 characters",
      ),
    },
  });

  // const { mutate, isLoading, isError, error } =
  //   api.election.createPartylist.useMutation({
  //     onSuccess: () => {
  //       notifications.show({
  //         title: `${form.values.name} (${form.values.acronym}) created!`,
  //         message: "Successfully created partylist",
  //         icon: <IconCheck size="1.1rem" />,
  //         autoClose: 5000,
  //       });
  //       close();
  //     },
  //   });

  useEffect(() => {
    if (opened) form.reset();
  }, [opened]);

  return (
    <>
      <Button
        onClick={open}
        style={() => ({
          width: "fit-content",
          // [theme.fn.smallerThan("xs")]: { width: "100%" },
        })}
        leftSection={<IconFlag size="1rem" />}
      >
        Add partylist
      </Button>
      <Modal
        opened={
          opened
          // || isLoading
        }
        onClose={close}
        title={<Text fw={600}>Create partylist</Text>}
      >
        <form
          onSubmit={form.onSubmit((value) => {
            void (async () => {
              await api.election.createPartylist.mutate({
                name: value.name,
                acronym: value.acronym,
                election_id,
              });
            })();
          })}
        >
          <Stack gap="sm">
            <TextInput
              placeholder="Enter partylist name"
              label="Name"
              required
              withAsterisk
              {...form.getInputProps("name")}
              leftSection={<IconLetterCase size="1rem" />}
            />

            <TextInput
              placeholder="Enter acronym"
              label="Acronym"
              required
              withAsterisk
              {...form.getInputProps("acronym")}
              leftSection={<IconLetterCase size="1rem" />}
            />

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
                type="submit"
                disabled={!form.isValid()}
                // loading={isLoading}
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
