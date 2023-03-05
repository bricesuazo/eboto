import {
  Modal,
  Button,
  Alert,
  Select,
  Group,
  TextInput,
  Text,
  Stack,
} from "@mantine/core";
import { api } from "../../utils/api";
import { useEffect } from "react";
import type { Candidate, Partylist, Position } from "@prisma/client";
import { hasLength, useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  IconAlertCircle,
  IconCheck,
  IconFlag,
  IconLetterCase,
  IconUserSearch,
} from "@tabler/icons-react";
import { useRouter } from "next/router";

const EditCandidateModal = ({
  isOpen,
  onClose,
  candidate,
  partylists,
  refetch,
  positions,
}: {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate;
  partylists: Partylist[];
  refetch: () => Promise<unknown>;
  positions: Position[];
}) => {
  const router = useRouter();
  const form = useForm({
    initialValues: {
      firstName: candidate.first_name,
      middleName: candidate.middle_name,
      lastName: candidate.last_name,
      slug: candidate.slug,
      partylistId: candidate.partylistId,
      position: candidate.positionId,
    },
    validateInputOnBlur: true,
    validate: {
      firstName: hasLength(
        { min: 3 },
        "First name must be at least 3 characters"
      ),
      lastName: hasLength(
        { min: 3 },
        "Last name must be at least 3 characters"
      ),
      slug: (value) => {
        if (!value) {
          return "Please enter an election slug";
        }
        if (!/^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/.test(value)) {
          return "Election slug must be alphanumeric and can contain dashes";
        }
        if (value.length < 3 || value.length > 24) {
          return "Election slug must be between 3 and 24 characters";
        }
      },
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
      editCandidateMutation.reset();
    }
  }, [isOpen]);

  return (
    <Modal
      opened={isOpen || editCandidateMutation.isLoading}
      onClose={onClose}
      title={
        <Text weight={600}>
          Edit Candidate - {candidate.first_name} {candidate.last_name}
        </Text>
      }
    >
      <form
        onSubmit={form.onSubmit((value) => {
          editCandidateMutation.mutate({
            id: candidate.id,
            firstName: value.firstName,
            lastName: value.lastName,
            slug: value.slug,
            partylistId: value.partylistId,
            electionId: candidate.electionId,
            positionId: value.position,
          });
        })}
      >
        <Stack spacing="sm">
          <TextInput
            label="First name"
            placeholder="Enter first name"
            required
            withAsterisk
            {...form.getInputProps("firstName")}
            icon={<IconLetterCase size="1rem" />}
          />

          <TextInput
            label="Middle name"
            placeholder="Enter middle name"
            {...form.getInputProps("middleName")}
            icon={<IconLetterCase size="1rem" />}
          />
          <TextInput
            label="Last name"
            placeholder="Enter last name"
            required
            withAsterisk
            {...form.getInputProps("lastName")}
            icon={<IconLetterCase size="1rem" />}
          />

          <TextInput
            label="Slug"
            placeholder="Enter slug"
            description={
              <Text>
                This will be used as the candidate&apos;s URL.
                <br />
                eboto-mo.com/{router.query.electionSlug?.toString()}/
                {form.values.slug || "candidate-slug"}
              </Text>
            }
            required
            withAsterisk
            {...form.getInputProps("slug")}
            error={
              form.errors.slug ||
              (editCandidateMutation.error?.data?.code === "CONFLICT" &&
                editCandidateMutation.error?.message)
            }
            icon={<IconLetterCase size="1rem" />}
          />

          <Select
            withinPortal
            placeholder="Select partylist"
            label="Partylist"
            icon={<IconFlag size="1rem" />}
            {...form.getInputProps("partylistId")}
            data={partylists.map((partylist) => {
              return {
                label: partylist.name,
                value: partylist.id,
              };
            })}
          />

          <Select
            withinPortal
            placeholder="Select position"
            label="Position"
            icon={<IconUserSearch size="1rem" />}
            {...form.getInputProps("position")}
            data={positions.map((position) => {
              return {
                label: position.name,
                value: position.id,
              };
            })}
          />

          {editCandidateMutation.isError &&
            editCandidateMutation.error?.data?.code !== "CONFLICT" && (
              <Alert
                icon={<IconAlertCircle size="1rem" />}
                title="Error"
                color="red"
              >
                {editCandidateMutation.error?.message}
              </Alert>
            )}

          <Group position="right" spacing="xs">
            <Button
              variant="default"
              onClick={onClose}
              disabled={editCandidateMutation.isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" loading={editCandidateMutation.isLoading}>
              Update
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

export default EditCandidateModal;
