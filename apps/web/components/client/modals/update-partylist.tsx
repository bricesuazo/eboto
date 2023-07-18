import {
  Modal,
  Button,
  TextInput,
  Group,
  Stack,
  Alert,
  Text,
} from "@mantine/core";
import { hasLength, useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  IconAlertCircle,
  IconCheck,
  IconLetterCase,
} from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import { Partylist } from "@eboto-mo/db/schema";
import { useMutation } from "@tanstack/react-query";
import { UpdatePartylistSchema } from "@/utils/zod-schema";
import { useEffect } from "react";
import { updatePartylist } from "@/actions";

export default function UpdatePartylist({
  partylist,
}: {
  partylist: Partylist;
}) {
  const [opened, { open, close }] = useDisclosure(false);
  const form = useForm<UpdatePartylistSchema>({
    initialValues: {
      id: partylist.id,
      election_id: partylist.election_id,
      name: partylist.name,
      acronym: partylist.acronym,
      description: partylist.description,
      logo_link: partylist.logo_link,
    },
    validateInputOnBlur: true,

    validate: {
      name: hasLength(
        {
          min: 3,
          max: 50,
        },
        "Name must be between 3 and 50 characters"
      ),
      acronym: hasLength(
        {
          min: 1,
          max: 24,
        },
        "Acronym must be between 1 and 24 characters"
      ),
    },
  });

  const { mutate, isLoading, isError, error } = useMutation({
    mutationFn: (updatePartylistInput: UpdatePartylistSchema) =>
      updatePartylist({
        id: partylist.id,
        election_id: partylist.election_id,
        name: updatePartylistInput.name,
        acronym: updatePartylistInput.acronym,
        description: updatePartylistInput.description,
        logo_link: updatePartylistInput.logo_link,
      }),
    onSuccess: async (_, data) => {
      notifications.show({
        title: "Election settings updated.",
        icon: <IconCheck size="1.1rem" />,
        message: "Your changes have been saved.",
        autoClose: 3000,
      });
      close();

      form.resetDirty(form.values);
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

  useEffect(() => {
    if (opened) {
      const dataForForm: typeof form.values = {
        name: partylist.name,
        acronym: partylist.acronym,
        description: partylist.description,
        logo_link: partylist.logo_link,
        election_id: partylist.election_id,
        id: partylist.id,
      };
      form.resetDirty();
    }
  }, [opened]);

  return (
    <>
      <Button onClick={open} variant="light" size="sm" compact>
        Edit
      </Button>
      <Modal
        opened={opened || isLoading}
        onClose={close}
        title={
          <Text weight={600}>
            Edit Partylist - {partylist.name} ({partylist.acronym})
          </Text>
        }
      >
        <form
          onSubmit={form.onSubmit((value) => {
            mutate({
              id: partylist.id,
              name: value.name,
              acronym: value.acronym,
              election_id: partylist.election_id,
              description: value.description,
              logo_link: value.logo_link,
            });
          })}
        >
          <Stack spacing="sm">
            <TextInput
              placeholder="Enter partylist name"
              label="Name"
              required
              withAsterisk
              {...form.getInputProps("name")}
              icon={<IconLetterCase size="1rem" />}
            />

            <TextInput
              placeholder="Enter acronym"
              label="Acronym"
              required
              withAsterisk
              {...form.getInputProps("acronym")}
              icon={<IconLetterCase size="1rem" />}
            />

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
                type="submit"
                disabled={!form.isDirty()}
                loading={isLoading}
              >
                Update
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
