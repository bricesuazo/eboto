"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/trpc/client";
import { transformUploadImage } from "@/utils";
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
} from "@mantine/core";
import { YearPickerInput } from "@mantine/dates";
import { Dropzone, DropzoneReject, IMAGE_MIME_TYPE } from "@mantine/dropzone";
import { hasLength, useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
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
} from "@tabler/icons-react";

import type { Candidate, Election } from "@eboto-mo/db/schema";

export default function EditCandidate({
  candidate,
  election,
}: {
  election: Election;
  candidate: Candidate & {
    credential: {
      id: string;
      affiliations: {
        id: string;
        org_name: string;
        org_position: string;
        start_year: Date;
        end_year: Date;
      }[];
      achievements: {
        id: string;
        name: string;
        year: Date;
      }[];
      events_attended: {
        id: string;
        name: string;
        year: Date;
      }[];
    } | null;
    platforms: {
      id: string;
      title: string;
      description: string;
    }[];
  };
}) {
  const context = api.useContext();
  const [opened, { open, close }] = useDisclosure(false);
  const openRef = useRef<() => void>(null);
  const partylistsQuery = api.partylist.getAllPartylistsByElectionId.useQuery({
    election_id: election.id,
  });
  const positionsQuery = api.position.getDashboardData.useQuery({
    election_id: election.id,
  });

  const initialValues = {
    first_name: candidate.first_name,
    middle_name: candidate.middle_name,
    last_name: candidate.last_name,
    old_slug: candidate.slug,
    new_slug: candidate.slug,
    partylist_id: candidate.partylist_id,

    position_id: candidate.position_id,
    image: candidate.image?.url ?? null,

    platforms: candidate.platforms ?? [],

    achievements: candidate.credential?.achievements ?? [],
    affiliations: candidate.credential?.affiliations ?? [],
    events_attended: candidate.credential?.events_attended ?? [],
  };

  const editCandidateMutation = api.candidate.edit.useMutation({
    onSuccess: async () => {
      await context.candidate.getDashboardData.invalidate();
      notifications.show({
        title: `${form.values.first_name}${
          form.values.middle_name && ` ${form.values.middle_name}`
        } ${form.values.last_name} created!`,
        message: `Successfully updated candidate: ${form.values.first_name}${
          form.values.middle_name && ` ${form.values.middle_name}`
        } ${form.values.last_name}`,
        icon: <IconCheck size="1.1rem" />,
        autoClose: 5000,
      });
      close();
    },
  });

  const form = useForm<{
    first_name: string;
    middle_name: string | null;
    last_name: string;
    old_slug: string;
    new_slug: string;
    partylist_id: string;
    position_id: string;
    image: File | null | string;

    platforms: {
      id: string;
      title: string;
      description: string;
    }[];

    achievements: {
      id: string;
      name: string;
      year: Date;
    }[];
    affiliations: {
      id: string;
      org_name: string;
      org_position: string;
      start_year: Date;
      end_year: Date;
    }[];
    events_attended: {
      id: string;
      name: string;
      year: Date;
    }[];
  }>({
    initialValues,
    validateInputOnBlur: true,
    validate: {
      first_name: hasLength(
        { min: 1 },
        "First name must be at least 1 characters",
      ),
      last_name: hasLength(
        { min: 1 },
        "Last name must be at least 1 characters",
      ),
      new_slug: (value) => {
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
      partylist_id: (value) => {
        if (!value) {
          return "Please select a partylist";
        }
      },
      position_id: (value) => {
        if (!value) {
          return "Please select a position";
        }
      },
    },
  });

  useEffect(() => {
    if (opened) {
      form.setValues(initialValues);
      form.resetDirty(initialValues);
      editCandidateMutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  const DeleteCredentialButton = ({
    type,
    id,
  }: {
    type: "PLATFORM" | "ACHIEVEMENT" | "AFFILIATION" | "EVENTATTENDED";
    id: string;
  }) => {
    const context = api.useContext();
    const deleteCredentialMutation =
      api.candidate.deleteSingleCredential.useMutation({
        onSuccess: async () => {
          await context.candidate.getDashboardData.invalidate();
        },
      });
    const deletePlatformMutation =
      api.candidate.deleteSinglePlatform.useMutation({
        onSuccess: async () => {
          await context.candidate.getDashboardData.invalidate();
        },
      });
    return (
      <Button
        variant="outline"
        mt="xs"
        size="xs"
        w="100%"
        color="red"
        onClick={async () => {
          if (type === "PLATFORM") {
            if (candidate.platforms.find((a) => a.id === id)) {
              await deletePlatformMutation.mutateAsync({ id });
              // await context.candidate.getAll.invalidate();
              close();
            } else {
              form.setValues({
                ...form.values,
                platforms: form.values.platforms.filter((a) => a.id !== id),
              });
            }
          } else if (type === "ACHIEVEMENT") {
            if (candidate.credential?.achievements.find((a) => a.id === id)) {
              await deleteCredentialMutation.mutateAsync({ id, type });
              // await context.candidate.getAll.invalidate();
              close();
            } else {
              form.setValues({
                ...form.values,
                achievements: form.values.achievements.filter(
                  (a) => a.id !== id,
                ),
              });
            }
          } else if (type === "AFFILIATION") {
            if (candidate.credential?.affiliations.find((a) => a.id === id)) {
              await deleteCredentialMutation.mutateAsync({ id, type });
              // await context.candidate.getAll.invalidate();
              close();
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
              candidate.credential?.events_attended.find((a) => a.id === id)
            ) {
              await deleteCredentialMutation.mutateAsync({ id, type });
              // await context.candidate.getAll.invalidate();
              close();
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
          deleteCredentialMutation.isLoading || deletePlatformMutation.isLoading
        }
      >
        Delete{" "}
        {(() => {
          switch (type) {
            case "PLATFORM":
              return "platform";
            case "ACHIEVEMENT":
              return "achievement";
            case "AFFILIATION":
              return "affiliation";
            case "EVENTATTENDED":
              return "seminar attended";
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
        opened={opened || editCandidateMutation.isLoading}
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
                  typeof values.image !== "string"
                    ? values.image !== null
                      ? await transformUploadImage(values.image)
                      : null
                    : undefined,

                credential_id: candidate.credential_id,
                platforms: values.platforms,

                achievements: values.achievements.map((a) => ({
                  id: a.id,
                  name: a.name,
                  year: new Date(a.year?.toDateString() ?? ""),
                })),

                affiliations: values.affiliations.map((a) => ({
                  id: a.id,
                  org_name: a.org_name,
                  org_position: a.org_position,
                  start_year: new Date(a.start_year?.toDateString() ?? ""),
                  end_year: new Date(a.end_year?.toDateString() ?? ""),
                })),
                eventsAttended: values.events_attended.map((a) => ({
                  id: a.id,
                  name: a.name,
                  year: new Date(a.year?.toDateString() ?? ""),
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
                    {...form.getInputProps("first_name")}
                    leftSection={<IconLetterCase size="1rem" />}
                  />

                  <TextInput
                    label="Middle name"
                    placeholder="Enter middle name"
                    {...form.getInputProps("middle_name")}
                    leftSection={<IconLetterCase size="1rem" />}
                  />
                  <TextInput
                    label="Last name"
                    placeholder="Enter last name"
                    required
                    withAsterisk
                    {...form.getInputProps("last_name")}
                    leftSection={<IconLetterCase size="1rem" />}
                  />

                  <TextInput
                    label="Slug"
                    placeholder="Enter slug"
                    description={
                      <Text size="xs">
                        This will be used as the candidate&apos;s URL.
                        <br />
                        eboto-mo.com/{election.slug}/
                        {form.values.new_slug || "candidate-slug"}
                      </Text>
                    }
                    required
                    withAsterisk
                    {...form.getInputProps("new_slug")}
                    leftSection={<IconLetterCase size="1rem" />}
                  />

                  <Select
                    // withinPortal
                    placeholder="Select partylist"
                    label="Partylist"
                    leftSection={<IconFlag size="1rem" />}
                    {...form.getInputProps("partylist_id")}
                    data={partylistsQuery.data?.map((partylist) => {
                      return {
                        label: partylist.name,
                        value: partylist.id,
                      };
                    })}
                  />

                  <Select
                    // withinPortal
                    placeholder="Select position"
                    label="Position"
                    leftSection={<IconUserSearch size="1rem" />}
                    {...form.getInputProps("position_id")}
                    data={positionsQuery.data?.map((position) => {
                      return {
                        label: position.name,
                        value: position.id,
                      };
                    })}
                  />
                </Stack>
              </TabsPanel>

              <TabsPanel value="image" pt="xs">
                <Stack gap="xs">
                  <Dropzone
                    id="image"
                    onDrop={(files) => {
                      if (!files[0]) return;
                      form.setFieldValue("image", files[0]);
                    }}
                    openRef={openRef}
                    maxSize={5 * 1024 ** 2}
                    accept={IMAGE_MIME_TYPE}
                    multiple={false}
                    loading={editCandidateMutation.isLoading}
                  >
                    <Group
                      justify="center"
                      gap="xl"
                      style={{ minHeight: rem(140), pointerEvents: "none" }}
                    >
                      {form.values.image ? (
                        typeof form.values.image !== "string" ? (
                          <Group justify="center">
                            <Box
                              pos="relative"
                              style={() => ({
                                width: rem(120),
                                height: rem(120),

                                // [theme.fn.smallerThan("sm")]: {
                                //   width: rem(180),
                                //   height: rem(180),
                                // },
                              })}
                            >
                              <Image
                                src={
                                  typeof form.values.image === "string"
                                    ? form.values.image
                                    : URL.createObjectURL(form.values.image)
                                }
                                alt="image"
                                fill
                                sizes="100%"
                                priority
                                style={{ objectFit: "cover" }}
                              />
                            </Box>
                            <Text>{form.values.image.name}</Text>
                          </Group>
                        ) : (
                          candidate.image && (
                            <Group>
                              <Box
                                pos="relative"
                                style={() => ({
                                  width: rem(120),
                                  height: rem(120),

                                  // [theme.fn.smallerThan("sm")]: {
                                  //   width: rem(180),
                                  //   height: rem(180),
                                  // },
                                })}
                              >
                                <Image
                                  src={candidate.image.url}
                                  alt="image"
                                  fill
                                  sizes="100%"
                                  priority
                                  style={{ objectFit: "cover" }}
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
                          image: candidate.image?.url ?? null,
                        });
                      }}
                      disabled={
                        form.values.image === (candidate.image?.url ?? null) ||
                        editCandidateMutation.isLoading
                      }
                      style={{ flex: 1 }}
                    >
                      Reset image
                    </Button>
                    <Button
                      onClick={() => {
                        form.setFieldValue("image", null);
                      }}
                      disabled={
                        !form.values.image || editCandidateMutation.isLoading
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
                      <TextInput
                        w="100%"
                        label="Title"
                        placeholder="Enter title"
                        required
                        value={platform.title}
                        onChange={(e) => {
                          form.setValues({
                            ...form.values,
                            platforms: form.values.platforms.map((p, i) => {
                              if (i === index) {
                                return {
                                  ...p,
                                  title: e.target.value,
                                };
                              }
                              return p;
                            }),
                          });
                        }}
                      />
                      <Textarea
                        w="100%"
                        label="Description"
                        placeholder="Enter description"
                        required
                        value={platform.description}
                        onChange={(e) => {
                          form.setValues({
                            ...form.values,
                            platforms: form.values.platforms.map((p, i) => {
                              if (i === index) {
                                return {
                                  ...p,
                                  description: e.target.value,
                                };
                              }
                              return p;
                            }),
                          });
                        }}
                      />

                      <DeleteCredentialButton
                        type="PLATFORM"
                        id={platform.id}
                      />
                    </Box>
                  ))}
                  <Button
                    leftSection={<IconPlus size="1.25rem" />}
                    onClick={() => {
                      form.setValues({
                        ...form.values,

                        platforms: [
                          ...form.values.platforms,
                          {
                            id: (form.values.platforms.length + 1).toString(),
                            title: "",
                            description: "",
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
                      {form.values.achievements.map((achievement, index) => {
                        return (
                          <Box key={index}>
                            <Flex gap="xs" align="end">
                              <TextInput
                                w="100%"
                                label="Achievement"
                                placeholder="Enter achievement"
                                required
                                value={achievement.name}
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
                                value={achievement.year}
                                onChange={(date) => {
                                  form.setValues({
                                    ...form.values,
                                    achievements: form.values.achievements.map(
                                      (achievement, i) =>
                                        i === index
                                          ? {
                                              ...achievement,
                                              year: new Date(
                                                date?.toString() ?? "",
                                              ),
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
                            />
                          </Box>
                        );
                      })}

                      <Button
                        leftSection={<IconPlus size="1.25rem" />}
                        onClick={() => {
                          form.setValues({
                            ...form.values,

                            achievements: [
                              ...form.values.achievements,
                              {
                                id: (
                                  form.values.achievements.length + 1
                                ).toString(),
                                name: "",
                                year: new Date(new Date().getFullYear(), 0),
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
                      {form.values.affiliations.map((affiliation, index) => {
                        return (
                          <Box key={index}>
                            <TextInput
                              w="100%"
                              label="Organization name"
                              placeholder="Enter organization name"
                              required
                              value={affiliation.org_name}
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
                                style={{ width: "100%" }}
                                popoverProps={{
                                  withinPortal: true,
                                }}
                                value={
                                  form.values.affiliations[index]?.start_year ??
                                  new Date()
                                }
                                onChange={(date) => {
                                  form.setValues({
                                    ...form.values,
                                    affiliations: form.values.affiliations.map(
                                      (affiliation, i) =>
                                        i === index
                                          ? {
                                              ...affiliation,
                                              start_year: new Date(
                                                date?.toString() ?? "",
                                              ),
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
                                style={{ width: "100%" }}
                                popoverProps={{
                                  withinPortal: true,
                                }}
                                value={
                                  form.values.affiliations[index]?.end_year ??
                                  new Date()
                                }
                                onChange={(date) => {
                                  form.setValues({
                                    ...form.values,
                                    affiliations: form.values.affiliations.map(
                                      (affiliation, i) =>
                                        i === index
                                          ? {
                                              ...affiliation,
                                              end_year: new Date(
                                                date?.toString() ?? "",
                                              ),
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
                            />
                          </Box>
                        );
                      })}

                      <Button
                        leftSection={<IconPlus size="1.25rem" />}
                        onClick={() => {
                          form.setValues({
                            ...form.values,

                            affiliations: [
                              ...form.values.affiliations,
                              {
                                id: (
                                  form.values.affiliations.length + 1
                                ).toString(),
                                org_name: "",
                                org_position: "",
                                start_year: new Date(
                                  new Date().getFullYear(),
                                  -1,
                                ),
                                end_year: new Date(new Date().getFullYear(), 0),
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
                        (events_attended, index) => {
                          return (
                            <Box key={index}>
                              <Flex gap="xs" align="end">
                                <TextInput
                                  w="100%"
                                  label="Seminars attended"
                                  placeholder="Enter seminars attended"
                                  required
                                  value={
                                    form.values.events_attended[index]?.name ??
                                    ""
                                  }
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
                                  // label="Year"
                                  placeholder="Enter year"
                                  popoverProps={{
                                    withinPortal: true,
                                  }}
                                  value={
                                    form.values.events_attended[index]?.year ??
                                    new Date()
                                  }
                                  onChange={(date) => {
                                    form.setValues({
                                      ...form.values,
                                      events_attended:
                                        form.values.events_attended.map(
                                          (achievement, i) =>
                                            i === index
                                              ? {
                                                  ...achievement,
                                                  year: new Date(
                                                    date?.toString() ?? "",
                                                  ),
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
                              />
                            </Box>
                          );
                        },
                      )}

                      <Button
                        leftSection={<IconPlus size="1.25rem" />}
                        onClick={() => {
                          form.setValues({
                            ...form.values,

                            events_attended: [
                              ...form.values.events_attended,
                              {
                                id: (
                                  form.values.events_attended.length + 1
                                ).toString(),
                                name: "",
                                year: new Date(new Date().getFullYear(), 0),
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
                  href={`/${election.slug}/${candidate.slug}`}
                  target="_blank"
                >
                  Visit
                </Button>

                <Group justify="right" gap="xs">
                  <Button
                    variant="default"
                    onClick={close}
                    disabled={editCandidateMutation.isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!form.isDirty() || !form.isValid()}
                    loading={editCandidateMutation.isLoading}
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
