import {
  Modal,
  Stack,
  Select,
  Text,
  Button,
  Alert,
  TextInput,
  Flex,
  Group,
} from "@mantine/core";
import { api } from "../../utils/api";
import { useEffect } from "react";
import { positionTemplate } from "../../constants";
import { useRouter } from "next/router";
import { convertNumberToHour } from "../../utils/convertNumberToHour";
import { useConfetti } from "../../lib/confetti";
import { notifications } from "@mantine/notifications";
import {
  IconAlertCircle,
  IconCalendar,
  IconCheck,
  IconClock,
  IconLetterCase,
  IconTemplate,
} from "@tabler/icons-react";
import { hasLength, isInRange, useForm } from "@mantine/form";
import { DatePickerInput } from "@mantine/dates";

const CreateElectionModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const router = useRouter();
  const { fireConfetti } = useConfetti();

  const form = useForm({
    initialValues: {
      name: "",
      slug: "",
      date: [null, null] as [Date | null, Date | null],
      voting_start: "7",
      voting_end: "19",
      template: "0",
    },
    validateInputOnBlur: true,
    validate: {
      name: hasLength(
        { min: 3 },
        "Election name must be at least 3 characters"
      ),
      slug: hasLength(
        { min: 3 },
        "Election slug must be at least 3 characters"
      ),
      date: (value) => {
        if (!value[0] || !value[1]) {
          return "Please select a date range";
        }
        if (value[0] > value[1]) {
          return "Start date must be before end date";
        }
        if (value[0] < new Date()) {
          return "Start date must be in the future";
        }
      },
    },
  });

  const createElectionMutation = api.election.create.useMutation({
    onSuccess: async (data) => {
      await router.push(`/dashboard/${data.slug}`);
      notifications.show({
        title: "Election created!",
        message: "Successfully created election",
        icon: <IconCheck size="1.1rem" />,
        autoClose: 5000,
      });
      onClose();
      await fireConfetti();
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset();
    } else {
      createElectionMutation.reset();
    }
  }, [isOpen]);

  return (
    <Modal
      opened={isOpen || createElectionMutation.isLoading}
      onClose={onClose}
      title="Create election"
    >
      <form onSubmit={form.onSubmit((value) => console.log(value))}>
        <Stack spacing="sm">
          <TextInput
            data-autofocus
            label="Election name"
            withAsterisk
            required
            placeholder="Enter election name"
            {...form.getInputProps("name")}
            icon={<IconLetterCase size="1rem" />}
          />

          <TextInput
            label="Election slug"
            description={
              <>
                This will be used as the URL for your election
                <br />
                eboto-mo.com/election-slug
              </>
            }
            withAsterisk
            required
            placeholder="Enter election slug"
            {...form.getInputProps("slug")}
            icon={<IconLetterCase size="1rem" />}
          />

          <DatePickerInput
            type="range"
            label="Pick dates range"
            placeholder="Pick dates range"
            required
            withAsterisk
            popoverProps={{
              withinPortal: true,
              position: "bottom",
            }}
            minDate={new Date(new Date().setDate(new Date().getDate() + 1))}
            firstDayOfWeek={0}
            {...form.getInputProps("date")}
            icon={<IconCalendar size="1rem" />}
          />
          <Stack spacing={8}>
            <Flex columnGap="sm">
              <Select
                label="Voting hour start"
                withAsterisk
                withinPortal
                required
                dropdownPosition="bottom"
                {...form.getInputProps("voting_start")}
                data={[...Array(24).keys()].map((_, i) => ({
                  label: convertNumberToHour(i),
                  value: i.toString(),
                }))}
                icon={<IconClock size="1rem" />}
              />
              <Select
                dropdownPosition="bottom"
                label="Voting hour start"
                withAsterisk
                withinPortal
                required
                {...form.getInputProps("voting_end")}
                data={[...Array(24).keys()].map((_, i) => ({
                  label: convertNumberToHour(i),
                  value: i.toString(),
                  disabled: i <= parseInt(form.values.voting_start),
                }))}
                icon={<IconClock size="1rem" />}
              />
            </Flex>
            <Text
              align="center"
              size="sm"
              opacity={createElectionMutation.isLoading ? 0.5 : 1}
            >
              {parseInt(form.values.voting_end) -
                parseInt(form.values.voting_start)}{" "}
              hour
              {parseInt(form.values.voting_end) -
                parseInt(form.values.voting_start) >
              1
                ? "s"
                : ""}
            </Text>
          </Stack>
          <Select
            label="Election template"
            description="Select a position template for your election"
            withAsterisk
            required
            withinPortal
            {...form.getInputProps("template")}
            data={positionTemplate.map((position) => ({
              label: position.org,
              value: position.id.toString(),
              group: position.college,
            }))}
            searchable
            dropdownPosition="bottom"
            nothingFound="No position template found"
            icon={<IconTemplate size="1rem" />}
          />

          {createElectionMutation.isError && (
            <Alert
              icon={<IconAlertCircle size="1rem" />}
              title="Error"
              color="red"
            >
              {createElectionMutation.error?.message}
            </Alert>
          )}

          <Group position="right" spacing="xs">
            <Button
              variant="default"
              mr={2}
              onClick={onClose}
              disabled={createElectionMutation.isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" loading={createElectionMutation.isLoading}>
              Create
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

export default CreateElectionModal;
