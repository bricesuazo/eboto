'use client';

import { createElection } from '@/actions';
import { positionTemplate } from '@/constants';
import {
  type CreateElectionSchema,
  createElectionSchema,
} from '@/utils/zod-schema';
import {
  Alert,
  Button,
  Flex,
  Group,
  Modal,
  Select,
  Stack,
  type Sx,
  Text,
  TextInput,
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { hasLength, useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import {
  IconAlertCircle,
  IconCalendar,
  IconClock,
  IconLetterCase,
  IconPlus,
  IconTemplate,
} from '@tabler/icons-react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function CreateElection({ sx }: { sx?: Sx | Sx[] }) {
  const router = useRouter();
  const [opened, { open, close }] = useDisclosure(false);

  const form = useForm<{
    name: string;
    slug: string;
    start_date: Date | null;
    end_date: Date | null;
    template: string;
  }>({
    initialValues: {
      name: '',
      slug: '',
      start_date: null,
      end_date: null,
      template: '0',
    },
    validateInputOnBlur: true,

    validate: {
      name: hasLength(
        { min: 3 },
        'Election name must be at least 3 characters',
      ),
      slug: (value) => {
        if (!value) {
          return 'Please enter an election slug';
        }
        if (!/^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/.test(value)) {
          return 'Election slug must be alphanumeric and can contain dashes';
        }
        if (value.length < 3 || value.length > 24) {
          return 'Election slug must be between 3 and 24 characters';
        }
      },
      start_date: (value, values) => {
        if (!value) {
          return 'Please enter an election start date';
        }
        if (values.end_date && value > values.end_date) {
          return 'Start date must be before end date';
        }
      },
      end_date: (value, values) => {
        if (!value) {
          return 'Please enter an election end date';
        }
        if (values.start_date && value < values.start_date) {
          return 'End date must be after start date';
        }
      },
    },
  });

  useEffect(() => {
    if (opened) {
      form.reset();
    }
  }, [opened]);

  const { mutate, isLoading, isError, error } = useMutation({
    mutationFn: (newElection: CreateElectionSchema) =>
      createElection({
        name: newElection.name,
        slug: newElection.slug,
        start_date: newElection.start_date,
        end_date: newElection.end_date,
        template: newElection.template,
      }),
    onSuccess: (_, { slug }) => {
      router.push(`/dashboard/${slug}`);
      close();
    },
  });

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
          onSubmit={form.onSubmit((value) => {
            const parsed = createElectionSchema.parse({
              ...value,
              template: parseInt(value.template),
            });
            mutate(parsed);
          })}
        >
          <Stack spacing="sm">
            <TextInput
              data-autofocus
              label="Election name"
              withAsterisk
              required
              placeholder="Enter election name"
              {...form.getInputProps('name')}
              icon={<IconLetterCase size="1rem" />}
              disabled={isLoading}
            />

            <TextInput
              label="Election slug"
              description={
                <>
                  This will be used as the URL for your election
                  <br />
                  eboto-mo.com/{form.values.slug || 'election-slug'}
                </>
              }
              disabled={isLoading}
              withAsterisk
              required
              placeholder="Enter election slug"
              {...form.getInputProps('slug')}
              icon={<IconLetterCase size="1rem" />}
              // error={
              //   form.errors.slug ||
              //   (createElectionMutation.error?.data?.code === "CONFLICT" &&
              //     createElectionMutation.error?.message)
              // }
            />

            <DateTimePicker
              valueFormat="MMMM DD, YYYY (dddd) hh:mm A"
              label="Election start date"
              placeholder="Enter election start date"
              description="You can't change the election date once the election has started."
              required
              withAsterisk
              clearable
              popoverProps={{
                withinPortal: true,
                position: 'bottom',
              }}
              minDate={new Date(new Date().setDate(new Date().getDate() + 1))}
              firstDayOfWeek={0}
              {...form.getInputProps('start_date')}
              icon={<IconCalendar size="1rem" />}
              disabled={isLoading}
            />
            <DateTimePicker
              valueFormat="MMMM DD, YYYY (dddd) hh:mm A"
              label="Election end date"
              placeholder="Enter election end date"
              description="You can't change the election date once the election has started."
              required
              withAsterisk
              clearable
              popoverProps={{
                withinPortal: true,
                position: 'bottom',
              }}
              minDate={
                form.values.start_date ||
                new Date(new Date().setDate(new Date().getDate() + 1))
              }
              firstDayOfWeek={0}
              {...form.getInputProps('end_date')}
              icon={<IconCalendar size="1rem" />}
              disabled={isLoading}
            />

            <Select
              label="Election template"
              description="Select a template for your election"
              withAsterisk
              required
              withinPortal
              {...form.getInputProps('template')}
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
              disabled={isLoading}
            />

            {isError && (
              <Alert
                icon={<IconAlertCircle size="1rem" />}
                title="Error"
                color="red"
              >
                {(error as Error).message}
              </Alert>
            )}

            <Group position="right" spacing="xs">
              <Button
                variant="default"
                mr={2}
                onClick={close}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!form.isValid()}
                loading={isLoading}
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
