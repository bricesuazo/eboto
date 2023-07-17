"use client";

import {
  Button,
  Modal,
  Select,
  Stack,
  Text,
  TextInput,
  Flex,
  Alert,
  Group,
  type Sx,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { hasLength, useForm } from "@mantine/form";
import {
  IconCalendar,
  IconClock,
  IconLetterCase,
  IconPlus,
  IconTemplate,
} from "@tabler/icons-react";
import { DatePickerInput, DateTimePicker } from "@mantine/dates";
import { positionTemplate } from "@/constants";
import { useEffect } from "react";

export default function CreateElection({ sx }: { sx?: Sx | Sx[] }) {
  const [opened, { open, close }] = useDisclosure(false);

  const form = useForm<{
    name: string;
    slug: string;
    start_date: Date | null;
    end_date: Date | null;
    template: string;
  }>({
    initialValues: {
      name: "",
      slug: "",
      start_date: null,
      end_date: null,
      template: "0",
    },
    validateInputOnBlur: true,
    validate: {
      name: hasLength(
        { min: 3 },
        "Election name must be at least 3 characters"
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

      start_date: (value) => {
        if (!value) {
          return "Please select a date range";
        }
      },
      end_date: (value, values) => {
        if (!value) {
          return "Please select a date range";
        }
        if (values.start_date && value < values.start_date) {
          return "End date must be after start date";
        }
      },
    },
  });

  useEffect(() => {
    if (opened) {
      form.setValues({
        name: "",
        slug: "",
        start_date: null,
        end_date: null,
        template: "0",
      });
    }
  }, [opened]);

  return (
    <>
      <Button onClick={open} sx={sx} leftIcon={<IconPlus size="1.25rem" />}>
        Create Election
      </Button>
      <Modal
        opened={opened}
        onClose={close}
        title="Create election"
        closeOnClickOutside={false}
      >
        <form
        // onSubmit={form.onSubmit((value) =>
        //   createElectionMutation.mutate({
        //     name: value.name,
        //     slug: value.slug,
        //     start_date:
        //       value.date[0] ||
        //       new Date(new Date().setDate(new Date().getDate() + 1)),
        //     end_date:
        //       value.date[1] ||
        //       new Date(new Date().setDate(new Date().getDate() + 8)),
        //     voting_start: parseInt(value.voting_start),
        //     voting_end: parseInt(value.voting_end),
        //     template: parseInt(value.template),
        //   })
        // )}
        >
          <Stack spacing="sm">
            <TextInput
              data-autofocus
              label="Election name"
              withAsterisk
              required
              placeholder="Enter election name"
              {...form.getInputProps("name")}
              icon={<IconLetterCase size="1rem" />}
              // disabled={createElectionMutation.isLoading}
            />

            <TextInput
              label="Election slug"
              description={
                <>
                  This will be used as the URL for your election
                  <br />
                  eboto-mo.com/{form.values.slug || "election-slug"}
                </>
              }
              // disabled={createElectionMutation.isLoading}
              withAsterisk
              required
              placeholder="Enter election slug"
              {...form.getInputProps("slug")}
              icon={<IconLetterCase size="1rem" />}
              // error={
              //   form.errors.slug ||
              //   (createElectionMutation.error?.data?.code === "CONFLICT" &&
              //     createElectionMutation.error?.message)
              // }
            />

            <DateTimePicker
              label="Election start date"
              placeholder="Enter election start date"
              description="You can't change the election date once the election has started."
              required
              withAsterisk
              popoverProps={{
                withinPortal: true,
                position: "bottom",
              }}
              minDate={new Date(new Date().setDate(new Date().getDate() + 1))}
              firstDayOfWeek={0}
              {...form.getInputProps("start_date")}
              icon={<IconCalendar size="1rem" />}
              // disabled={createElectionMutation.isLoading}
            />
            <DateTimePicker
              label="Election end date"
              placeholder="Enter election end date"
              description="You can't change the election date once the election has started."
              required
              withAsterisk
              popoverProps={{
                withinPortal: true,
                position: "bottom",
              }}
              minDate={
                form.values.start_date ||
                new Date(new Date().setDate(new Date().getDate() + 1))
              }
              firstDayOfWeek={0}
              {...form.getInputProps("end_date")}
              icon={<IconCalendar size="1rem" />}
              // disabled={createElectionMutation.isLoading}
            />

            <Select
              label="Election template"
              description="Select a template for your election"
              withAsterisk
              required
              withinPortal
              {...form.getInputProps("template")}
              data={positionTemplate
                .sort((a, b) => a.id - b.id)
                .map((position) => ({
                  label: position.org,
                  value: position.id.toString(),
                  group: position.college,
                }))}
              nothingFound="No position template found"
              icon={<IconTemplate size="1rem" />}
              searchable
              // disabled={createElectionMutation.isLoading}
            />

            {/* {createElectionMutation.isError &&
              createElectionMutation.error?.data?.code !== "CONFLICT" && (
                <Alert
                  icon={<IconAlertCircle size="1rem" />}
                  title="Error"
                  color="red"
                >
                  {createElectionMutation.error?.message}
                </Alert>
              )} */}

            <Group position="right" spacing="xs">
              <Button
                variant="default"
                mr={2}
                onClick={close}
                // disabled={createElectionMutation.isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!form.isValid()}
                // loading={createElectionMutation.isLoading}
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
