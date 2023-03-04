import { Modal, Button, Alert, Select, Group, TextInput } from "@mantine/core";
import { api } from "../../utils/api";
import { useEffect } from "react";
import type { Candidate, Partylist } from "@prisma/client";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconCheck } from "@tabler/icons-react";

const EditCandidateModal = ({
  isOpen,
  onClose,
  candidate,
  partylists,
  refetch,
}: {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate;
  partylists: Partylist[];
  refetch: () => Promise<unknown>;
}) => {
  const form = useForm({
    initialValues: {
      firstName: candidate.first_name,
      lastName: candidate.last_name,
      slug: candidate.slug,
      partylistId: candidate.partylistId,
    },
  });

  const editCandidateMutation = api.candidate.editSingle.useMutation({
    onSuccess: async (data) => {
      await refetch();
      notifications.show({
        title: `${data.first_name} updated!`,
        message: "Successfully updated candidate",
        icon: <IconCheck size="1.1rem" />,
        autoClose: 5000,
      });
      onClose();
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset();
    } else {
      editCandidateMutation.reset();
    }
  }, [isOpen]);

  return (
    <Modal
      opened={isOpen || editCandidateMutation.isLoading}
      onClose={close}
      title={`Edit Candidate - ${candidate.first_name} ${candidate.last_name}`}
    >
      <form
        onSubmit={form.onSubmit((value) => {
          void (async () => {
            await editCandidateMutation.mutateAsync({
              id: candidate.id,
              firstName: value.firstName,
              lastName: value.lastName,
              slug: value.slug,
              partylistId: value.partylistId,
              electionId: candidate.electionId,
              positionId: candidate.positionId,
            });
          })();
        })}
      >
        <TextInput
          placeholder="Enter candidate's first name"
          type="text"
          {...form.getInputProps("firstName")}
        />

        <TextInput
          placeholder="Enter candidate's middle name"
          type="text"
          {...form.getInputProps("middleName")}
        />

        <TextInput
          placeholder="Enter candidate's last name"
          type="text"
          {...form.getInputProps("lastName")}
        />

        <TextInput
          placeholder="Enter candidate name"
          type="text"
          {...form.getInputProps("slug")}
        />

        <Select
          placeholder="Select partylist"
          data={partylists.map((partylist) => ({
            label: partylist.name,
            value: partylist.id,
          }))}
          {...form.getInputProps("partylistId")}
        />
        {editCandidateMutation.error && (
          <Alert color="red" title="Error">
            {editCandidateMutation.error.message}
          </Alert>
        )}
        <Group>
          <Button
            variant="ghost"
            mr={2}
            onClick={onClose}
            disabled={editCandidateMutation.isLoading}
          >
            Cancel
          </Button>
          <Button
            color="blue"
            type="submit"
            loading={editCandidateMutation.isLoading}
          >
            Create
          </Button>
        </Group>
      </form>
    </Modal>
  );
};

export default EditCandidateModal;
