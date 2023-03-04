import {
  Modal,
  Stack,
  Button,
  Alert,
  Select,
  Group,
  TextInput,
} from "@mantine/core";
import { api } from "../../utils/api";
import { useEffect } from "react";
import type { Partylist, Position } from "@prisma/client";
import { notifications } from "@mantine/notifications";
import { IconCheck } from "@tabler/icons-react";
import { useForm } from "@mantine/form";

const CreateCandidateModal = ({
  isOpen,
  onClose,
  position,
  refetch,
  partylists,
}: {
  isOpen: boolean;
  onClose: () => void;
  position: Position;
  refetch: () => Promise<unknown>;
  partylists: Partylist[];
}) => {
  const createCandidateMutation = api.candidate.createSingle.useMutation({
    onSuccess: async (data) => {
      await refetch();
      notifications.show({
        title: `${data.first_name} ${data.last_name} created!`,
        message: "Successfully created position",
        icon: <IconCheck size="1.1rem" />,
        autoClose: 5000,
      });
      onClose();
    },
  });

  const form = useForm({
    initialValues: {
      firstName: "",
      lastName: "",
      slug: "",
      partylistId: "",
      position: "",
      middleName: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset();
    } else {
      createCandidateMutation.reset();
    }
  }, [isOpen]);

  return (
    <Modal
      opened={isOpen || createCandidateMutation.isLoading}
      onClose={close}
      title="Create candidate"
    >
      <form
        onSubmit={form.onSubmit((value) => {
          void (async () => {
            await createCandidateMutation.mutateAsync({
              firstName: value.firstName,
              lastName: value.lastName,
              slug: value.slug,
              partylistId: value.partylistId,
              position,
              middleName: value.middleName,
            });
          })();
        })}
      >
        <Stack>
          <TextInput
            placeholder="Enter position name"
            type="text"
            {...form.getInputProps("firstName")}
          />

          <TextInput
            placeholder="Enter middle name"
            type="text"
            {...form.getInputProps("middleName")}
          />
          <TextInput
            placeholder="Enter last name"
            type="text"
            {...form.getInputProps("lastName")}
          />
          <TextInput
            placeholder="Enter slug"
            type="text"
            {...form.getInputProps("slug")}
          />

          <Select
            placeholder="Select partylist"
            {...form.getInputProps("partylistId")}
            data={partylists.map((partylist) => {
              return {
                label: partylist.name,
                value: partylist.id,
              };
            })}
          />
        </Stack>
        {createCandidateMutation.error && (
          <Alert color="red" title="Error">
            {createCandidateMutation.error.message}
          </Alert>
        )}

        <Group>
          <Button
            mr={2}
            onClick={onClose}
            disabled={createCandidateMutation.isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" loading={createCandidateMutation.isLoading}>
            Create
          </Button>
        </Group>
      </form>
    </Modal>
  );
};

export default CreateCandidateModal;
