import {
  Modal,
  Stack,
  Button,
  Alert,
  Select,
  Group,
  TextInput,
  Text,
} from "@mantine/core";
import { api } from "../../utils/api";
import { useEffect } from "react";
import type { Partylist, Position } from "@prisma/client";
import { notifications } from "@mantine/notifications";
import {
  IconAlertCircle,
  IconCheck,
  IconFlag,
  IconLetterCase,
  IconUserSearch,
} from "@tabler/icons-react";
import { hasLength, useForm } from "@mantine/form";
import { useRouter } from "next/router";

const CreateCandidateModal = ({
  isOpen,
  onClose,
  position,
  refetch,
  partylists,
  positions,
}: {
  isOpen: boolean;
  onClose: () => void;
  position: Position;
  refetch: () => Promise<unknown>;
  partylists: Partylist[];
  positions: Position[];
}) => {
  const router = useRouter();
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
      partylistId: partylists[0]?.id || "",
      middleName: "",
      position: position.id,
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

  useEffect(() => {
    if (isOpen) {
      form.reset();
      createCandidateMutation.reset();
    }
  }, [isOpen]);

  return (
    <Modal
      opened={isOpen || createCandidateMutation.isLoading}
      onClose={onClose}
      title={<Text weight={600}>Create candidate</Text>}
    >
      <form
        onSubmit={form.onSubmit((value) => {
          createCandidateMutation.mutate({
            firstName: value.firstName,
            lastName: value.lastName,
            slug: value.slug,
            partylistId: value.partylistId,
            position: {
              id: value.position,
              electionId: position.electionId,
            },
            middleName: value.middleName,
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
              (createCandidateMutation.error?.data?.code === "CONFLICT" &&
                createCandidateMutation.error?.message)
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

          {createCandidateMutation.isError &&
            createCandidateMutation.error?.data?.code !== "CONFLICT" && (
              <Alert
                icon={<IconAlertCircle size="1rem" />}
                title="Error"
                color="red"
              >
                {createCandidateMutation.error?.message}
              </Alert>
            )}

          <Group position="right" spacing="xs">
            <Button
              variant="default"
              onClick={onClose}
              disabled={createCandidateMutation.isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" loading={createCandidateMutation.isLoading}>
              Create
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

export default CreateCandidateModal;
