'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ActionIcon,
  Alert,
  Box,
  Button,
  Flex,
  Group,
  Modal,
  rem,
  Select,
  SimpleGrid,
  Stack,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core';
import { YearPickerInput } from '@mantine/dates';
import { Dropzone, DropzoneReject, IMAGE_MIME_TYPE } from '@mantine/dropzone';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconAlertCircle,
  IconCheck,
  IconExternalLink,
  IconFlag,
  IconInfoCircle,
  IconLetterCase,
  IconPhoto,
  IconPlus,
  IconUserSearch,
  IconX,
} from '@tabler/icons-react';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import moment from 'moment';
import { v4 as uuid } from 'uuid';

import { formatName } from '@eboto/constants';

import type { EditCandidate } from '~/schema/candidate';
import { EditCandidateSchema } from '~/schema/candidate';
import { api } from '~/trpc/client';
import { transformUploadImage } from '~/utils';
import type { Database } from '../../../../../supabase/types';

export default function EditCandidate({
  candidate,
  election,
}: {
  election: Database['public']['Tables']['elections']['Row'];
  candidate: Database['public']['Tables']['candidates']['Row'] & {
    image_url: string | null;
    credential: {
      id: string;
      affiliations: {
        id: string;
        org_name: string;
        org_position: string;
        start_year: string;
        end_year: string;
      }[];
      achievements: {
        id: string;
        name: string;
        year: string;
      }[];
      events_attended: {
        id: string;
        name: string;
        year: string;
      }[];
    } | null;
    platforms: {
      id: string;
      title: string;
      description: string | undefined;
    }[];
  };
}) {
  const context = api.useUtils();
  const [opened, { open, close }] = useDisclosure(false);
  const openRef = useRef<() => void>(null);
  const partylistsQuery = api.partylist.getAllPartylistsByElectionId.useQuery({
    election_id: election.id,
  });
  const positionsQuery = api.position.getDashboardData.useQuery({
    election_slug: election.slug,
  });

  const initialValues: EditCandidate = {
    first_name: candidate.first_name,
    middle_name: candidate.middle_name,
    last_name: candidate.last_name,
    old_slug: candidate.slug,
    new_slug: candidate.slug,
    partylist_id: candidate.partylist_id,

    position_id: candidate.position_id,
    image: candidate.image_url,

    platforms: candidate.platforms,

    achievements: (candidate.credential?.achievements ?? []).map(
      (achievement) => ({
        ...achievement,
        year: achievement.year,
      }),
    ),
    affiliations: (candidate.credential?.affiliations ?? []).map(
      (affiliation) => ({
        ...affiliation,
        start_year: affiliation.start_year,
        end_year: affiliation.end_year,
      }),
    ),
    events_attended: (candidate.credential?.events_attended ?? []).map(
      (event) => ({
        ...event,
        year: event.year,
      }),
    ),
  };

  const editCandidateMutation = api.candidate.edit.useMutation({
    onSuccess: async () => {
      await context.candidate.getDashboardData.invalidate();
      notifications.show({
        title: `${formatName(election.name_arrangement, candidate)} updated!`,
        message: `Successfully updated candidate: ${formatName(
          election.name_arrangement,
          candidate,
        )}`,
        icon: <IconCheck size="1.1rem" />,
        autoClose: 5000,
      });
      close();
    },
  });

  const form = useForm<EditCandidate>({
    initialValues,
    validate: zod4Resolver(EditCandidateSchema),
  });

  useEffect(() => {
    if (opened) {
      form.setValues(initialValues);
      form.resetDirty(initialValues);
      editCandidateMutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  useEffect(() => {
    form.setValues({
      ...form.values,
      new_slug:
        `${form.values.first_name} ${form.values.middle_name} ${form.values.last_name}`
          .toLowerCase()
          .replace(/[^a-z0-9 ]/g, '')
          .replace(/\s+/g, ' ')
          .trim()
          .split(' ')
          .join('-'),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.values.first_name, form.values.middle_name, form.values.last_name]);

  const DeleteCredentialButton = ({
    type,
    id,
    disabled,
  }: {
    type: 'PLATFORM' | 'ACHIEVEMENT' | 'AFFILIATION' | 'EVENTATTENDED';
    id: string | number;
    disabled?: boolean;
  }) => {
    const context = api.useUtils();
    const deleteCredentialMutation =
      api.candidate.deleteSingleCredential.useMutation({
        onSuccess: async () => {
          await context.candidate.getDashboardData.invalidate();
          const data = {
            ...form.values,
            achievements: form.values.achievements.filter((a) => a.id !== id),
            affiliations: form.values.affiliations.filter((a) => a.id !== id),
            events_attended: form.values.events_attended.filter(
              (a) => a.id !== id,
            ),
          };
          form.setValues(data);
          form.resetDirty(data);
        },
      });
    const deletePlatformMutation =
      api.candidate.deleteSinglePlatform.useMutation({
        onSuccess: async () => {
          await context.candidate.getDashboardData.invalidate();
          const data = {
            ...form.values,
            platforms: form.values.platforms.filter((a) => a.id !== id),
          };
          form.setValues(data);
          form.resetDirty(data);
        },
      });
    return (
      <Button
        variant="outline"
        mt="xs"
        size="xs"
        w="100%"
        color="red"
        disabled={disabled}
        onClick={async () => {
          if (type === 'PLATFORM') {
            if (
              candidate.platforms.find((a) => a.id === id) &&
              typeof id === 'string'
            ) {
              await deletePlatformMutation.mutateAsync({ id });
            } else {
              form.setValues({
                ...form.values,
                platforms: form.values.platforms.filter((a) => a.id !== id),
              });
            }
          } else if (type === 'ACHIEVEMENT') {
            if (
              candidate.credential?.achievements.find((a) => a.id === id) &&
              typeof id === 'string'
            ) {
              await deleteCredentialMutation.mutateAsync({ id, type });
            } else {
              form.setValues({
                ...form.values,
                achievements: form.values.achievements.filter(
                  (a) => a.id !== id,
                ),
              });
            }
          } else if (type === 'AFFILIATION') {
            if (
              candidate.credential?.affiliations.find((a) => a.id === id) &&
              typeof id === 'string'
            ) {
              await deleteCredentialMutation.mutateAsync({ id, type });
            } else {
              form.setValues({
                ...form.values,
                affiliations: form.values.affiliations.filter(
                  (a) => a.id !== id,
                ),
              });
            }
          } else {
            if (
              candidate.credential?.events_attended.find((a) => a.id === id) &&
              typeof id === 'string'
            ) {
              await deleteCredentialMutation.mutateAsync({ id, type });
            } else {
              form.setValues({
                ...form.values,
                events_attended: form.values.events_attended.filter(
                  (a) => a.id !== id,
                ),
              });
            }
          }
        }}
        loading={
          deleteCredentialMutation.isPending || deletePlatformMutation.isPending
        }
      >
        Delete{' '}
        {(() => {
          switch (type) {
            case 'PLATFORM':
              return 'platform';
            case 'ACHIEVEMENT':
              return 'achievement';
            case 'AFFILIATION':
              return 'affiliation';
            case 'EVENTATTENDED':
              return 'seminar attended';
          }
        })()}
      </Button>
    );
  };

  return (
    <>
      <Button onClick={open} variant="light" size="compact-sm" w="fit-content">
        Edit
      </Button>
      <Modal
        opened={opened || editCandidateMutation.isPending}
        onClose={close}
        title={
          <Text fw={600} lineClamp={1}>
            Edit Candidate - {candidate.first_name} {candidate.last_name}
          </Text>
        }
        closeOnClickOutside={false}
      >
        <form
          onSubmit={form.onSubmit((values) => {
            void (async () => {
              await editCandidateMutation.mutateAsync({
                id: candidate.id,
                first_name: values.first_name,
                middle_name: values.middle_name,
                last_name: values.last_name,
                old_slug: candidate.slug,
                new_slug: values.new_slug,
                partylist_id: values.partylist_id,
                election_id: election.id,
                position_id: values.position_id,
                image:
                  typeof values.image !== 'string'
                    ? values.image !== null
                      ? await transformUploadImage(values.image)
                      : null
                    : undefined,

                credential_id: candidate.credential_id,
                platforms: values.platforms,

                achievements: values.achievements.map((a) => ({
                  id: a.id,
                  name: a.name,
                  year: a.year,
                })),
                affiliations: values.affiliations.map((a) => ({
                  id: a.id,
                  org_name: a.org_name,
                  org_position: a.org_position,
                  start_year: a.start_year,
                  end_year: a.end_year,
                })),
                events_attended: values.events_attended.map((a) => ({
                  id: a.id,
                  name: a.name,
                  year: a.year,
                })),
              });
            })();
          })}
        >
          <Tabs radius="xs" defaultValue="basic-info">
            <TabsList grow>
              <SimpleGrid cols={2} w="100%" spacing={0} verticalSpacing={0}>
                <TabsTab
                  value="basic-info"
                  leftSection={<IconUserSearch size="0.8rem" />}
                  px="2rem"
                >
                  Basic Info
                </TabsTab>
                <TabsTab
                  value="image"
                  leftSection={<IconPhoto size="0.8rem" />}
                  px="2rem"
                >
                  Image
                </TabsTab>
                <TabsTab
                  value="platforms"
                  leftSection={<IconInfoCircle size="0.8rem" />}
                  px="2rem"
                >
                  Platforms
                </TabsTab>
                <TabsTab
                  value="credentials"
                  leftSection={<IconInfoCircle size="0.8rem" />}
                  px="2rem"
                >
                  Credentials
                </TabsTab>
              </SimpleGrid>
            </TabsList>

            <Stack gap="sm">
              <TabsPanel value="basic-info" pt="xs">
                <Stack gap="xs">
                  <TextInput
                    label="First name"
                    placeholder="Enter first name"
                    required
                    withAsterisk
                    {...form.getInputProps('first_name')}
                    leftSection={<IconLetterCase size="1rem" />}
                    disabled={editCandidateMutation.isPending}
                  />

                  <TextInput
                    label="Middle name"
                    placeholder="Enter middle name"
                    {...form.getInputProps('middle_name')}
                    leftSection={<IconLetterCase size="1rem" />}
                    disabled={editCandidateMutation.isPending}
                  />
                  <TextInput
                    label="Last name"
                    placeholder="Enter last name"
                    required
                    withAsterisk
                    {...form.getInputProps('last_name')}
                    leftSection={<IconLetterCase size="1rem" />}
                    disabled={editCandidateMutation.isPending}
                  />

                  <TextInput
                    label="Slug"
                    placeholder="Enter slug"
                    description={
                      <Text size="xs" component="span">
                        This will be used as the candidate&apos;s URL.
                        <br />
                        eboto.app/{election.slug}/
                        {form.values.new_slug || 'candidate-slug'}
                      </Text>
                    }
                    required
                    withAsterisk
                    {...form.getInputProps('new_slug')}
                    leftSection={<IconLetterCase size="1rem" />}
                    disabled={editCandidateMutation.isPending}
                  />

                  <Select
                    // withinPortal
                    placeholder="Select partylist"
                    label="Partylist"
                    leftSection={<IconFlag size="1rem" />}
                    {...form.getInputProps('partylist_id')}
                    data={partylistsQuery.data?.map((partylist) => ({
                      label: partylist.name,
                      value: partylist.id,
                    }))}
                    disabled={editCandidateMutation.isPending}
                  />

                  <Select
                    placeholder="Select position"
                    label="Position"
                    leftSection={<IconUserSearch size="1rem" />}
                    disabled={editCandidateMutation.isPending}
                    {...form.getInputProps('position_id')}
                    data={positionsQuery.data?.positions.map((position) => ({
                      label: position.name,
                      value: position.id,
                    }))}
                  />
                </Stack>
              </TabsPanel>

              <TabsPanel value="image" pt="xs">
                <Stack gap="xs">
                  <Dropzone
                    id="image"
                    onDrop={(files) => {
                      if (!files[0]) return;
                      form.setFieldValue('image', files[0]);
                    }}
                    openRef={openRef}
                    maxSize={5 * 1024 ** 2}
                    accept={IMAGE_MIME_TYPE}
                    multiple={false}
                    loading={editCandidateMutation.isPending}
                  >
                    <Group
                      justify="center"
                      gap="xl"
                      style={{ minHeight: rem(140), pointerEvents: 'none' }}
                    >
                      {form.values.image ? (
                        typeof form.values.image !== 'string' ? (
                          <Group justify="center">
                            <Box
                              pos="relative"
                              style={() => ({
                                width: rem(120),
                                height: rem(120),
                              })}
                            >
                              <Image
                                src={
                                  typeof form.values.image === 'string'
                                    ? form.values.image
                                    : URL.createObjectURL(form.values.image)
                                }
                                alt="image"
                                fill
                                sizes="100%"
                                priority
                                style={{ objectFit: 'cover' }}
                              />
                            </Box>
                            <Text>{form.values.image.name}</Text>
                          </Group>
                        ) : (
                          candidate.image_url && (
                            <Group>
                              <Box
                                pos="relative"
                                style={() => ({
                                  width: rem(120),
                                  height: rem(120),
                                })}
                              >
                                <Image
                                  src={candidate.image_url}
                                  alt="image"
                                  fill
                                  sizes="100%"
                                  priority
                                  style={{ objectFit: 'cover' }}
                                />
                              </Box>
                              <Text>Current image</Text>
                            </Group>
                          )
                        )
                      ) : (
                        <Box>
                          <Text size="xl" inline ta="center">
                            Drag image here or click to select image
                          </Text>
                          <Text size="sm" c="dimmed" inline mt={7} ta="center">
                            Attach a image to your account. Max file size is
                            5MB.
                          </Text>
                        </Box>
                      )}
                      <DropzoneReject>
                        <IconX size="3.2rem" stroke={1.5} />
                      </DropzoneReject>
                    </Group>
                  </Dropzone>
                  <Group gap="sm">
                    <Button
                      onClick={() => {
                        form.setValues({
                          ...form.values,
                          image: candidate.image_url ?? null,
                        });
                      }}
                      disabled={
                        form.values.image === (candidate.image_url ?? null) ||
                        editCandidateMutation.isPending
                      }
                      style={{ flex: 1 }}
                    >
                      Reset image
                    </Button>
                    <Button
                      onClick={() => {
                        form.setFieldValue('image', null);
                      }}
                      disabled={
                        !form.values.image || editCandidateMutation.isPending
                      }
                      style={{ flex: 1 }}
                    >
                      Delete image
                    </Button>
                  </Group>
                </Stack>
              </TabsPanel>

              <TabsPanel value="platforms" pt="xs">
                <Stack gap="xs">
                  {form.values.platforms.map((platform, index) => (
                    <Box key={index}>
                      <Stack gap="xs">
                        <TextInput
                          w="100%"
                          label="Title"
                          placeholder="Enter title"
                          required
                          value={platform.title}
                          disabled={editCandidateMutation.isPending}
                          onChange={(e) => {
                            form.setValues({
                              ...form.values,
                              platforms: form.values.platforms.map((p, i) =>
                                i === index
                                  ? {
                                      ...p,
                                      title: e.target.value,
                                    }
                                  : p,
                              ),
                            });
                          }}
                        />
                        <Textarea
                          w="100%"
                          label="Description"
                          placeholder="Enter description"
                          value={platform.description ?? ''}
                          disabled={editCandidateMutation.isPending}
                          onChange={(e) => {
                            form.setValues({
                              ...form.values,
                              platforms: form.values.platforms.map((p, i) =>
                                i === index
                                  ? {
                                      ...p,
                                      description: e.target.value,
                                    }
                                  : p,
                              ),
                            });
                          }}
                        />
                      </Stack>

                      <DeleteCredentialButton
                        type="PLATFORM"
                        id={platform.id}
                        disabled={editCandidateMutation.isPending}
                      />
                    </Box>
                  ))}
                  <Button
                    leftSection={<IconPlus size="1.25rem" />}
                    disabled={editCandidateMutation.isPending}
                    onClick={() => {
                      form.setValues({
                        ...form.values,

                        platforms: [
                          ...form.values.platforms,
                          {
                            id: uuid(),
                            title: '',
                            description: '',
                          },
                        ],
                      });
                    }}
                  >
                    Add platform
                  </Button>
                </Stack>
              </TabsPanel>

              <TabsPanel value="credentials" pt="xs">
                <Tabs variant="outline" radius="xs" defaultValue="achievements">
                  <TabsList grow>
                    <TabsTab value="achievements">
                      <Text size="xs" truncate>
                        Achievement
                      </Text>
                    </TabsTab>
                    <TabsTab value="affiliations">
                      <Text size="xs" truncate>
                        Affiliations
                      </Text>
                    </TabsTab>
                    <TabsTab value="events-attended">
                      <Text size="xs" truncate>
                        Seminars Attended
                      </Text>
                    </TabsTab>
                  </TabsList>

                  <TabsPanel value="achievements" pt="xs">
                    <Stack gap="md">
                      {form.values.achievements.map((achievement, index) => (
                        <Box key={index}>
                          <Flex gap="xs" align="end">
                            <TextInput
                              w="100%"
                              label="Achievement"
                              placeholder="Enter achievement"
                              required
                              value={achievement.name}
                              disabled={editCandidateMutation.isPending}
                              onChange={(e) => {
                                form.setValues({
                                  ...form.values,
                                  achievements: form.values.achievements.map(
                                    (achievement, i) =>
                                      i === index
                                        ? {
                                            ...achievement,
                                            name: e.target.value,
                                          }
                                        : achievement,
                                  ),
                                });
                              }}
                            />
                            <YearPickerInput
                              label="Year"
                              placeholder="Enter year"
                              popoverProps={{
                                withinPortal: true,
                              }}
                              value={new Date(achievement.year)}
                              disabled={editCandidateMutation.isPending}
                              onChange={(date) => {
                                form.setValues({
                                  ...form.values,
                                  achievements: form.values.achievements.map(
                                    (achievement, i) =>
                                      i === index
                                        ? {
                                            ...achievement,
                                            year: moment(date).format(),
                                          }
                                        : achievement,
                                  ),
                                });
                              }}
                              required
                            />
                          </Flex>
                          <DeleteCredentialButton
                            type="ACHIEVEMENT"
                            id={achievement.id}
                            disabled={editCandidateMutation.isPending}
                          />
                        </Box>
                      ))}

                      <Button
                        leftSection={<IconPlus size="1.25rem" />}
                        disabled={editCandidateMutation.isPending}
                        onClick={() => {
                          form.setValues({
                            ...form.values,

                            achievements: [
                              ...form.values.achievements,
                              {
                                id: uuid(),
                                name: '',
                                year: moment().format('YYYY'),
                              },
                            ],
                          });
                        }}
                      >
                        Add achievement
                      </Button>
                    </Stack>
                  </TabsPanel>
                  <TabsPanel value="affiliations" pt="xs">
                    <Stack gap="md">
                      {form.values.affiliations.map((affiliation, index) => (
                        <Box key={index}>
                          <TextInput
                            w="100%"
                            label="Organization name"
                            placeholder="Enter organization name"
                            required
                            value={affiliation.org_name}
                            disabled={editCandidateMutation.isPending}
                            onChange={(e) => {
                              form.setValues({
                                ...form.values,
                                affiliations: form.values.affiliations.map(
                                  (affiliation, i) =>
                                    i === index
                                      ? {
                                          ...affiliation,
                                          org_name: e.target.value,
                                        }
                                      : affiliation,
                                ),
                              });
                            }}
                          />
                          <TextInput
                            w="100%"
                            label="Position"
                            placeholder="Enter your position in the organization"
                            required
                            value={affiliation.org_position}
                            disabled={editCandidateMutation.isPending}
                            onChange={(e) => {
                              form.setValues({
                                ...form.values,
                                affiliations: form.values.affiliations.map(
                                  (affiliation, i) =>
                                    i === index
                                      ? {
                                          ...affiliation,
                                          org_position: e.target.value,
                                        }
                                      : affiliation,
                                ),
                              });
                            }}
                          />

                          <Flex gap="xs">
                            <YearPickerInput
                              label="Start year"
                              placeholder="Enter start year"
                              style={{ width: '100%' }}
                              popoverProps={{
                                withinPortal: true,
                              }}
                              value={new Date(affiliation.start_year)}
                              disabled={editCandidateMutation.isPending}
                              onChange={(date) => {
                                form.setValues({
                                  ...form.values,
                                  affiliations: form.values.affiliations.map(
                                    (affiliation, i) =>
                                      i === index
                                        ? {
                                            ...affiliation,
                                            start_year: moment(date).format(),
                                          }
                                        : affiliation,
                                  ),
                                });
                              }}
                              required
                            />
                            <YearPickerInput
                              label="End year"
                              placeholder="Enter end year"
                              style={{ width: '100%' }}
                              popoverProps={{
                                withinPortal: true,
                              }}
                              value={new Date(affiliation.end_year)}
                              disabled={editCandidateMutation.isPending}
                              onChange={(date) => {
                                form.setValues({
                                  ...form.values,
                                  affiliations: form.values.affiliations.map(
                                    (affiliation, i) =>
                                      i === index
                                        ? {
                                            ...affiliation,
                                            end_year: moment(date).format(),
                                          }
                                        : affiliation,
                                  ),
                                });
                              }}
                              required
                            />
                          </Flex>
                          <DeleteCredentialButton
                            type="AFFILIATION"
                            id={affiliation.id}
                            disabled={editCandidateMutation.isPending}
                          />
                        </Box>
                      ))}

                      <Button
                        leftSection={<IconPlus size="1.25rem" />}
                        disabled={editCandidateMutation.isPending}
                        onClick={() => {
                          form.setValues({
                            ...form.values,

                            affiliations: [
                              ...form.values.affiliations,
                              {
                                id: uuid(),
                                org_name: '',
                                org_position: '',
                                start_year: new Date(
                                  new Date().getFullYear(),
                                  -1,
                                ).toISOString(),
                                end_year: moment().format('YYYY'),
                              },
                            ],
                          });
                        }}
                      >
                        Add affiliation
                      </Button>
                    </Stack>
                  </TabsPanel>
                  <TabsPanel value="events-attended" pt="xs">
                    <Stack gap="md">
                      {form.values.events_attended.map(
                        (events_attended, index) => (
                          <Box key={index}>
                            <Flex gap="xs" align="end">
                              <TextInput
                                w="100%"
                                label="Seminars attended"
                                placeholder="Enter seminars attended"
                                required
                                value={
                                  form.values.events_attended[index]?.name ?? ''
                                }
                                disabled={editCandidateMutation.isPending}
                                onChange={(e) => {
                                  form.setValues({
                                    ...form.values,
                                    events_attended:
                                      form.values.events_attended.map(
                                        (achievement, i) =>
                                          i === index
                                            ? {
                                                ...achievement,
                                                name: e.target.value,
                                              }
                                            : achievement,
                                      ),
                                  });
                                }}
                              />
                              <YearPickerInput
                                label="Year"
                                required
                                placeholder="Enter year"
                                popoverProps={{
                                  withinPortal: true,
                                }}
                                value={new Date(events_attended.year)}
                                disabled={editCandidateMutation.isPending}
                                onChange={(date) => {
                                  form.setValues({
                                    ...form.values,
                                    events_attended:
                                      form.values.events_attended.map(
                                        (achievement, i) =>
                                          i === index
                                            ? {
                                                ...achievement,
                                                year: moment(date).format(),
                                              }
                                            : achievement,
                                      ),
                                  });
                                }}
                                // required
                              />
                            </Flex>
                            <DeleteCredentialButton
                              type="EVENTATTENDED"
                              id={events_attended.id}
                              disabled={editCandidateMutation.isPending}
                            />
                          </Box>
                        ),
                      )}

                      <Button
                        leftSection={<IconPlus size="1.25rem" />}
                        disabled={editCandidateMutation.isPending}
                        onClick={() => {
                          form.setValues({
                            ...form.values,

                            events_attended: [
                              ...form.values.events_attended,
                              {
                                id: uuid(),
                                name: '',
                                year: moment().format('YYYY'),
                              },
                            ],
                          });
                        }}
                      >
                        Add seminar attended
                      </Button>
                    </Stack>
                  </TabsPanel>
                </Tabs>
              </TabsPanel>

              {editCandidateMutation.isError && (
                <Alert
                  icon={<IconAlertCircle size="1rem" />}
                  title="Error"
                  color="red"
                >
                  {editCandidateMutation.error.message}
                </Alert>
              )}

              <Group justify="space-between" gap={0}>
                <ActionIcon
                  size="lg"
                  variant="outline"
                  color="green"
                  hiddenFrom="xs"
                >
                  <IconExternalLink size="1.25rem" />
                </ActionIcon>
                <Button
                  visibleFrom="xs"
                  leftSection={<IconExternalLink size="1.25rem" />}
                  variant="outline"
                  component={Link}
                  href={{ pathname: `/${election.slug}/${candidate.slug}` }}
                  target="_blank"
                >
                  Visit
                </Button>

                <Group justify="right" gap="xs">
                  <Button
                    variant="default"
                    onClick={close}
                    disabled={editCandidateMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!form.isDirty() || !form.isValid()}
                    loading={editCandidateMutation.isPending}
                  >
                    Update
                  </Button>
                </Group>
              </Group>
            </Stack>
          </Tabs>
        </form>
      </Modal>
    </>
  );
}
