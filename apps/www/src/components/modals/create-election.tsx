'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { MantineStyleProp } from '@mantine/core';
import {
  ActionIcon,
  Alert,
  Box,
  Button,
  Flex,
  Group,
  InputDescription,
  InputLabel,
  Modal,
  NumberInput,
  RangeSlider,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconAlertCircle,
  IconCalendar,
  IconCheck,
  IconLetterCase,
  IconMinus,
  IconPlus,
  IconTemplate,
} from '@tabler/icons-react';
import { zod4Resolver } from 'mantine-form-zod-resolver';

import { parseHourTo12HourFormat, positionTemplate } from '@eboto/constants';

import { useConfetti } from '~/components/providers';
import type { CreateElection as CreateElectionType } from '~/schema/election';
import { CreateElectionSchema } from '~/schema/election';
import type { GetPlus } from '~/schema/plus';
import { GetPlusSchema } from '~/schema/plus';
import { api } from '~/trpc/client';

export default function CreateElection({
  style,
}: {
  style?: MantineStyleProp;
}) {
  const router = useRouter();
  const { fireConfetti } = useConfetti();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [
    openedCreateElection,
    { open: openCreateElection, close: closeCreateElection },
  ] = useDisclosure(false);
  const [openedGetPlus, { open: openGetPlus, close: closeGetPlus }] =
    useDisclosure(false);
  const getElectionsPlusLeftQuery =
    api.election.getElectionsPlusLeft.useQuery();
  const plusMutation = api.payment.plus.useMutation({
    onSuccess: (url) => {
      if (!url) return;

      setIsRedirecting(true);
      router.push(url);
    },
    onError: (error) => {
      notifications.show({
        title: 'Error',
        message: error.message,
        color: 'red',
        autoClose: 3000,
      });
    },
  });

  const createElectionMutation = api.election.create.useMutation({
    onSuccess: () => {
      router.push(`/dashboard/${formCreateElection.values.slug}`);
      closeCreateElection();
      notifications.show({
        title: 'Election created!',
        message: 'Successfully created election',
        icon: <IconCheck size="1.1rem" />,
        autoClose: 5000,
      });
      fireConfetti();
    },
  });

  const formCreateElection = useForm<CreateElectionType>({
    validateInputOnBlur: true,
    initialValues: {
      name: '',
      slug: '',
      date: [null, null],
      template: 'none',
      voting_hours: [7, 19],
    },
    validate: zod4Resolver(CreateElectionSchema),
  });

  const formGetPlus = useForm<GetPlus>({
    validateInputOnBlur: true,
    initialValues: {
      quantity: 1,
    },
    validate: zod4Resolver(GetPlusSchema),
  });

  useEffect(() => {
    formCreateElection.setValues({
      ...formCreateElection.values,
      slug: formCreateElection.values.name
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .split(' ')
        .join('-'),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formCreateElection.values.name]);

  useEffect(() => {
    if (openedCreateElection) {
      formCreateElection.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openedCreateElection]);
  useEffect(() => {
    if (openedGetPlus) {
      formGetPlus.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openedGetPlus]);

  return (
    <>
      <Button
        onClick={
          getElectionsPlusLeftQuery.data !== 0
            ? openCreateElection
            : openGetPlus
        }
        style={style}
        leftSection={<IconPlus size="1.25rem" />}
        disabled={getElectionsPlusLeftQuery.isLoading}
        radius="xl"
      >
        Create Election
      </Button>

      <Modal
        opened={openedGetPlus}
        onClose={closeGetPlus}
        title="Get Plus to create more elections"
      >
        <Flex direction="column" gap="xl">
          <Box>
            <Title order={1} fz={80} ta="center">
              0
            </Title>
            <Title order={2} ta="center">
              Elections left
            </Title>
          </Box>
          <ActionIcon.Group px="xl">
            <ActionIcon
              variant="default"
              size={60}
              onClick={() => {
                if (formGetPlus.values.quantity === 1) return;

                formGetPlus.setValues({
                  quantity: formGetPlus.values.quantity - 1,
                });
              }}
              disabled={formGetPlus.values.quantity === 1}
            >
              <IconMinus stroke={4} />
            </ActionIcon>
            <NumberInput
              size="xl"
              fz="xl"
              inputMode="numeric"
              value={formGetPlus.values.quantity.toString()}
              hideControls
              readOnly
              styles={{
                input: {
                  textAlign: 'center',
                  fontSize: '2rem',
                  padding: '0.5rem',
                },
              }}
            />
            <ActionIcon
              variant="default"
              size={60}
              onClick={() =>
                formGetPlus.setValues({
                  quantity: formGetPlus.values.quantity + 1,
                })
              }
            >
              <IconPlus stroke={4} />
            </ActionIcon>
          </ActionIcon.Group>
          <Text ta="center">Get Plus to create more elections!</Text>
          <Flex direction="column" gap="xs" justify="center" align="center">
            <Button
              w={{ base: '100%', md: 'auto' }}
              size="lg"
              radius="xl"
              style={{ marginBottom: 'auto' }}
              loading={plusMutation.isPending}
              onClick={() =>
                plusMutation.mutate({ quantity: formGetPlus.values.quantity })
              }
              rightSection={!isRedirecting ? <IconPlus /> : undefined}
              disabled={isRedirecting}
            >
              {isRedirecting ? 'Redirecting...' : 'Get Plus'}
            </Button>
            <Button
              variant="subtle"
              radius="xl"
              onClick={closeGetPlus}
              disabled={plusMutation.isPending || isRedirecting}
            >
              Close
            </Button>
          </Flex>
        </Flex>
      </Modal>
      <Modal
        opened={openedCreateElection}
        onClose={closeCreateElection}
        title="Create election"
        closeOnClickOutside={false}
      >
        <form
          onSubmit={formCreateElection.onSubmit((value) => {
            const now = new Date();
            now.setSeconds(0);
            now.setMilliseconds(0);

            createElectionMutation.mutate({
              ...value,
              name: value.name.trim(),
              slug: value.slug.trim(),
              date: [
                value.date[0] ??
                  new Date(now.setDate(now.getDate() + 1)).toISOString(),
                value.date[1] ??
                  new Date(now.setDate(now.getDate() + 5)).toISOString(),
              ],
              template: value.template,
              voting_hours: value.voting_hours,
            });
          })}
        >
          <Stack gap="sm">
            <TextInput
              data-autofocus
              label="Election name"
              withAsterisk
              required
              placeholder="Enter election name"
              leftSection={<IconLetterCase size="1rem" />}
              disabled={createElectionMutation.isPending}
              error={
                createElectionMutation.error?.data?.code === 'CONFLICT' &&
                createElectionMutation.error.message
              }
              {...formCreateElection.getInputProps('name')}
            />

            <TextInput
              label="Election slug"
              description={
                <>
                  This will be used as the URL for your election
                  <br />
                  eboto.app/{formCreateElection.values.slug || 'election-slug'}
                </>
              }
              disabled={createElectionMutation.isPending}
              withAsterisk
              required
              placeholder="Enter election slug"
              leftSection={<IconLetterCase size="1rem" />}
              error={
                createElectionMutation.error?.data?.code === 'CONFLICT' &&
                createElectionMutation.error.message
              }
              {...formCreateElection.getInputProps('slug')}
            />

            <DatePickerInput
              allowSingleDateInRange
              type="range"
              label="Election start and end date"
              placeholder="Enter election start and end date"
              description="You can't change the election date once the election has started."
              leftSection={<IconCalendar size="1rem" />}
              minDate={new Date(new Date().setDate(new Date().getDate() + 1))}
              firstDayOfWeek={0}
              required
              disabled={createElectionMutation.isPending}
              {...formCreateElection.getInputProps('date')}
            />

            <Box>
              <InputLabel required>Voting Hours</InputLabel>
              <InputDescription>
                Voters can only vote within the specified hours (
                {formCreateElection.values.voting_hours[0] === 0 &&
                formCreateElection.values.voting_hours[1] === 24
                  ? 'Whole day'
                  : parseHourTo12HourFormat(
                      formCreateElection.values.voting_hours[0],
                    ) +
                    ' - ' +
                    parseHourTo12HourFormat(
                      formCreateElection.values.voting_hours[1],
                    )}
                )
              </InputDescription>
              <RangeSlider
                defaultValue={[7, 19]}
                step={1}
                max={24}
                min={0}
                minRange={1}
                maxRange={24}
                marks={[
                  { value: 7, label: '7AM' },
                  { value: 19, label: '7PM' },
                ]}
                label={parseHourTo12HourFormat}
                {...formCreateElection.getInputProps('voting_hours')}
              />
            </Box>

            <Select
              label="Election template"
              description="Select a template for your election"
              placeholder="Select a template"
              withAsterisk
              required
              {...formCreateElection.getInputProps('template')}
              data={positionTemplate
                .sort((a, b) => a.order - b.order)
                .map((template) => ({
                  group: template.name,

                  items: template.organizations.map((organization) => ({
                    // disabled: formCreateElection.values.template === organization.id,
                    value: organization.id,
                    label: organization.name,
                  })),
                }))}
              nothingFoundMessage="No position template found"
              leftSection={<IconTemplate size="1rem" />}
              searchable
              disabled={createElectionMutation.isPending}
            />

            {createElectionMutation.isError && (
              <Alert
                icon={<IconAlertCircle size="1rem" />}
                title="Error"
                color="red"
              >
                {createElectionMutation.error.message}
              </Alert>
            )}

            <Group justify="right" gap="xs">
              <Button
                variant="default"
                mr={2}
                onClick={closeCreateElection}
                disabled={createElectionMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!formCreateElection.isValid()}
                loading={createElectionMutation.isPending}
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
