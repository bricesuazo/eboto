import {
  Modal,
  Button,
  Alert,
  Select,
  Group,
  TextInput,
  Text,
  Stack,
  Tabs,
  rem,
  Box,
  Flex,
} from "@mantine/core";
import { api } from "../../utils/api";
import type {
  Achievement,
  Affiliation,
  Candidate,
  Credential,
  EventAttended,
  Partylist,
  Position,
} from "@prisma/client";
import { hasLength, useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  IconAlertCircle,
  IconCheck,
  IconFlag,
  IconInfoCircle,
  IconLetterCase,
  IconPhoto,
  IconPlus,
  IconUserSearch,
  IconX,
} from "@tabler/icons-react";
import { useRouter } from "next/router";
import { useDidUpdate } from "@mantine/hooks";
import { useRef, useState } from "react";
import {
  Dropzone,
  type FileWithPath,
  IMAGE_MIME_TYPE,
} from "@mantine/dropzone";
import Image from "next/image";
import { uploadImage } from "../../utils/uploadImage";
import { YearPickerInput, type DateValue } from "@mantine/dates";
import { IconExternalLink } from "@tabler/icons-react";
import Link from "next/link";

const EditCandidateModal = ({
  isOpen,
  onClose,
  candidate,
  partylists,
  positions,
}: {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate & {
    credential:
      | (Credential & {
          achievements: Achievement[];
          affiliations: Affiliation[];
          eventsAttended: EventAttended[];
        })
      | null;
  };
  partylists: Partylist[];
  positions: Position[];
}) => {
  const context = api.useContext();
  const router = useRouter();
  const openRef = useRef<() => void>(null);
  const [loading, setLoading] = useState(false);
  const form = useForm<{
    firstName: string;
    middleName: string | null;
    lastName: string;
    slug: string;
    partylistId: string;
    position: string;
    image: FileWithPath | null | string;

    achievements: { id: string; name: string; year: DateValue }[];
    affiliations: {
      id: string;
      org_name: string;
      org_postion: string;
      start_year: DateValue;
      end_year: DateValue;
    }[];
    eventAttended: { id: string; name: string; year: DateValue }[];
  }>({
    initialValues: {
      firstName: candidate.first_name,
      middleName: candidate.middle_name,
      lastName: candidate.last_name,
      slug: candidate.slug,
      partylistId: candidate.partylistId,
      position: candidate.positionId,
      image: candidate.image,

      achievements: candidate.credential?.achievements ?? [],
      affiliations: candidate.credential?.affiliations ?? [],
      eventAttended: candidate.credential?.eventsAttended ?? [],
    },
    validateInputOnBlur: true,
    validate: {
      firstName: hasLength(
        { min: 1 },
        "First name must be at least 1 characters"
      ),
      lastName: hasLength(
        { min: 1 },
        "Last name must be at least 1 characters"
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
      await context.candidate.getAll.invalidate();
      const dataForForm = {
        firstName: data.first_name,
        middleName: data.middle_name,
        lastName: data.last_name,
        slug: data.slug,
        partylistId: data.partylistId,
        position: data.positionId,
        image: data.image,

        achievements: data.credential?.achievements ?? [],
        affiliations: data.credential?.affiliations ?? [],
        eventAttended: data.credential?.eventsAttended ?? [],
      };

      form.setValues(dataForForm);
      form.resetDirty(dataForForm);

      notifications.show({
        title: `${data.first_name} updated!`,
        message: "Successfully updated candidate",
        icon: <IconCheck size="1.1rem" />,
        autoClose: 5000,
      });
      onClose();
    },
  });

  useDidUpdate(() => {
    if (isOpen) {
      editCandidateMutation.reset();

      const dataForForm = {
        firstName: candidate.first_name,
        middleName: candidate.middle_name,
        lastName: candidate.last_name,
        slug: candidate.slug,
        partylistId: candidate.partylistId,
        position: candidate.positionId,
        image: candidate.image,

        achievements: candidate.credential?.achievements ?? [],
        affiliations: candidate.credential?.affiliations ?? [],
        eventAttended: candidate.credential?.eventsAttended ?? [],
      };

      form.setValues(dataForForm);
      form.resetDirty(dataForForm);
    }
  }, [isOpen]);

  const DeleteCredentialButton = ({
    type,
    id,
  }: {
    type: "ACHIEVEMENT" | "AFFILIATION" | "EVENTATTENDED";
    id: string;
  }) => {
    const deleteCredentialMutation =
      api.candidate.deleteSingleCredential.useMutation();
    return (
      <Button
        variant="outline"
        mt="xs"
        size="xs"
        w="100%"
        color="red"
        onClick={async () => {
          if (type === "ACHIEVEMENT") {
            if (candidate.credential?.achievements.find((a) => a.id === id)) {
              await deleteCredentialMutation.mutateAsync({ id, type });
              await context.candidate.getAll.invalidate();
              onClose();
            } else {
              form.setValues({
                ...form.values,
                achievements: form.values.achievements.filter(
                  (a) => a.id !== id
                ),
              });
            }
          } else if (type === "AFFILIATION") {
            if (candidate.credential?.affiliations.find((a) => a.id === id)) {
              await deleteCredentialMutation.mutateAsync({ id, type });
              await context.candidate.getAll.invalidate();
              onClose();
            } else {
              form.setValues({
                ...form.values,
                affiliations: form.values.affiliations.filter(
                  (a) => a.id !== id
                ),
              });
            }
          } else {
            if (candidate.credential?.eventsAttended.find((a) => a.id === id)) {
              await deleteCredentialMutation.mutateAsync({ id, type });
              await context.candidate.getAll.invalidate();
              onClose();
            } else {
              form.setValues({
                ...form.values,
                eventAttended: form.values.eventAttended.filter(
                  (a) => a.id !== id
                ),
              });
            }
          }
        }}
        loading={deleteCredentialMutation.isLoading}
      >
        {type === "ACHIEVEMENT"
          ? "Delete Achievement"
          : type === "AFFILIATION"
          ? "Delete Affiliation"
          : "Delete Event Attended"}
      </Button>
    );
  };

  return (
    <Modal
      opened={isOpen || loading}
      onClose={onClose}
      title={
        <Text weight={600} lineClamp={1}>
          Edit Candidate - {candidate.first_name} {candidate.last_name}
        </Text>
      }
    >
      <form
        onSubmit={form.onSubmit((value) => {
          void (async () => {
            setLoading(true);

            await editCandidateMutation.mutateAsync({
              id: candidate.id,
              firstName: value.firstName,
              middleName: value.middleName,
              lastName: value.lastName,
              slug: value.slug,
              partylistId: value.partylistId,
              electionId: candidate.electionId,
              positionId: value.position,
              image: !value.image
                ? null
                : typeof value.image === "string"
                ? value.image
                : await uploadImage({
                    path: `elections/${candidate.electionId}/candidates/${
                      candidate.id
                    }/image/${Date.now().toString()}`,
                    image: value.image,
                  }),
              achievements: value.achievements.map((a) => ({
                id: a.id,
                name: a.name,
                year: new Date(a.year?.toDateString() ?? ""),
              })),

              affiliations: value.affiliations.map((a) => ({
                id: a.id,
                org_name: a.org_name,
                org_postion: a.org_postion,
                start_year: new Date(a.start_year?.toDateString() ?? ""),
                end_year: new Date(a.end_year?.toDateString() ?? ""),
              })),
              eventsAttended: value.eventAttended.map((a) => ({
                id: a.id,
                name: a.name,
                year: new Date(a.year?.toDateString() ?? ""),
              })),
            });

            setLoading(false);
          })();
        })}
      >
        <Tabs radius="xs" defaultValue="basic">
          <Tabs.List grow>
            <Tabs.Tab value="basic" icon={<IconUserSearch size="0.8rem" />}>
              Basic Info
            </Tabs.Tab>
            <Tabs.Tab value="image" icon={<IconPhoto size="0.8rem" />}>
              Image
            </Tabs.Tab>
            <Tabs.Tab
              value="credentials"
              icon={<IconInfoCircle size="0.8rem" />}
            >
              Credentials
            </Tabs.Tab>
          </Tabs.List>

          <Stack spacing="sm">
            <Tabs.Panel value="basic" pt="xs">
              <Stack spacing="xs">
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
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="image" pt="xs">
              <Stack spacing="xs">
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
                  loading={loading}
                  disabled={loading}
                >
                  <Group
                    position="center"
                    spacing="xl"
                    style={{ minHeight: rem(140), pointerEvents: "none" }}
                  >
                    {form.values.image ? (
                      typeof form.values.image !== "string" &&
                      form.values.image ? (
                        <Group position="center">
                          <Box
                            pos="relative"
                            sx={(theme) => ({
                              width: rem(120),
                              height: rem(120),

                              [theme.fn.smallerThan("sm")]: {
                                width: rem(180),
                                height: rem(180),
                              },
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
                            />
                          </Box>
                          <Text>{form.values.image.name}</Text>
                        </Group>
                      ) : (
                        candidate.image && (
                          <Group>
                            <Box
                              pos="relative"
                              sx={(theme) => ({
                                width: rem(120),
                                height: rem(120),

                                [theme.fn.smallerThan("sm")]: {
                                  width: rem(180),
                                  height: rem(180),
                                },
                              })}
                            >
                              <Image
                                src={candidate.image}
                                alt="image"
                                fill
                                sizes="100%"
                                priority
                              />
                            </Box>
                            <Text>Current image</Text>
                          </Group>
                        )
                      )
                    ) : (
                      <Box>
                        <Text size="xl" inline align="center">
                          Drag image here or click to select image
                        </Text>
                        <Text
                          size="sm"
                          color="dimmed"
                          inline
                          mt={7}
                          align="center"
                        >
                          Attach a image to your account. Max file size is 5MB.
                        </Text>
                      </Box>
                    )}
                    <Dropzone.Reject>
                      <IconX size="3.2rem" stroke={1.5} />
                    </Dropzone.Reject>
                  </Group>
                </Dropzone>
                <Flex gap="sm">
                  <Button
                    onClick={() => {
                      form.setValues({
                        ...form.values,
                        image: candidate.image,
                      });
                    }}
                    disabled={
                      !candidate.image ||
                      typeof form.values.image === "string" ||
                      loading
                    }
                    sx={{ flex: 1 }}
                  >
                    Reset image
                  </Button>
                  <Button
                    onClick={() => {
                      form.setFieldValue("image", null);
                    }}
                    disabled={!form.values.image || loading}
                    sx={{ flex: 1 }}
                  >
                    Delete image
                  </Button>
                </Flex>
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="credentials" pt="xs">
              <Tabs variant="outline" radius="xs" defaultValue="achievements">
                <Tabs.List grow>
                  <Tabs.Tab value="achievements">
                    <Text size="xs" truncate>
                      Achievement
                    </Text>
                  </Tabs.Tab>
                  <Tabs.Tab value="affiliations">
                    <Text size="xs" truncate>
                      Affiliations
                    </Text>
                  </Tabs.Tab>
                  <Tabs.Tab value="events-attended">
                    <Text size="xs" truncate>
                      Seminars Attended
                    </Text>
                  </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="achievements" pt="xs">
                  <Stack spacing="md">
                    {form.values.achievements.map((achievement, index) => {
                      return (
                        <Box key={index}>
                          <Flex gap="xs">
                            <TextInput
                              w="100%"
                              label="Achievement"
                              placeholder="Enter achievement"
                              required
                              value={
                                form.values.achievements[index]?.name ?? ""
                              }
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
                                        : achievement
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
                              value={
                                form.values.achievements[index]?.year ??
                                new Date()
                              }
                              onChange={(date) => {
                                form.setValues({
                                  ...form.values,
                                  achievements: form.values.achievements.map(
                                    (achievement, i) =>
                                      i === index
                                        ? {
                                            ...achievement,
                                            year: date,
                                          }
                                        : achievement
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
                      leftIcon={<IconPlus size="1.25rem" />}
                      onClick={() => {
                        form.setValues({
                          ...form.values,

                          achievements: [
                            ...form.values.achievements,
                            {
                              id: "",
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
                </Tabs.Panel>
                <Tabs.Panel value="affiliations" pt="xs">
                  <Stack spacing="md">
                    {form.values.affiliations.map((affiliation, index) => {
                      return (
                        <Box key={index}>
                          <TextInput
                            w="100%"
                            label="Organization name"
                            placeholder="Enter organization name"
                            required
                            value={
                              form.values.affiliations[index]?.org_name ?? ""
                            }
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
                                      : affiliation
                                ),
                              });
                            }}
                          />
                          <TextInput
                            w="100%"
                            label="Position"
                            placeholder="Enter your position in the organization"
                            required
                            value={
                              form.values.affiliations[index]?.org_postion ?? ""
                            }
                            onChange={(e) => {
                              form.setValues({
                                ...form.values,
                                affiliations: form.values.affiliations.map(
                                  (affiliation, i) =>
                                    i === index
                                      ? {
                                          ...affiliation,
                                          org_postion: e.target.value,
                                        }
                                      : affiliation
                                ),
                              });
                            }}
                          />

                          <Flex gap="xs">
                            <YearPickerInput
                              label="Start year"
                              placeholder="Enter start year"
                              w="100%"
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
                                            start_year: date,
                                          }
                                        : affiliation
                                  ),
                                });
                              }}
                              required
                            />
                            <YearPickerInput
                              label="End year"
                              placeholder="Enter end year"
                              w="100%"
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
                                            end_year: date,
                                          }
                                        : affiliation
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
                      leftIcon={<IconPlus size="1.25rem" />}
                      onClick={() => {
                        form.setValues({
                          ...form.values,

                          affiliations: [
                            ...form.values.affiliations,
                            {
                              id: "",
                              org_name: "",
                              org_postion: "",
                              start_year: new Date(
                                new Date().getFullYear(),
                                -1
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
                </Tabs.Panel>
                <Tabs.Panel value="events-attended" pt="xs">
                  <Stack spacing="md">
                    {form.values.eventAttended.map((eventAttended, index) => {
                      return (
                        <Box key={index}>
                          <Flex gap="xs">
                            <TextInput
                              w="100%"
                              label="Seminars attended"
                              placeholder="Enter seminars attended"
                              required
                              value={
                                form.values.eventAttended[index]?.name ?? ""
                              }
                              onChange={(e) => {
                                form.setValues({
                                  ...form.values,
                                  eventAttended: form.values.eventAttended.map(
                                    (achievement, i) =>
                                      i === index
                                        ? {
                                            ...achievement,
                                            name: e.target.value,
                                          }
                                        : achievement
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
                              value={
                                form.values.eventAttended[index]?.year ??
                                new Date()
                              }
                              onChange={(date) => {
                                form.setValues({
                                  ...form.values,
                                  eventAttended: form.values.eventAttended.map(
                                    (achievement, i) =>
                                      i === index
                                        ? {
                                            ...achievement,
                                            year: date,
                                          }
                                        : achievement
                                  ),
                                });
                              }}
                              required
                            />
                          </Flex>
                          <DeleteCredentialButton
                            type="EVENTATTENDED"
                            id={eventAttended.id}
                          />
                        </Box>
                      );
                    })}

                    <Button
                      leftIcon={<IconPlus size="1.25rem" />}
                      onClick={() => {
                        form.setValues({
                          ...form.values,

                          eventAttended: [
                            ...form.values.eventAttended,
                            {
                              id: "",
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
                </Tabs.Panel>
              </Tabs>
            </Tabs.Panel>

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

            <Group position="apart">
              <Button
                leftIcon={<IconExternalLink size="1.25rem" />}
                variant="outline"
                component={Link}
                href={`/${router.query.electionSlug as string}/${
                  candidate.slug
                }`}
                target="_blank"
              >
                Visit
              </Button>

              <Group position="right" spacing="xs">
                <Button variant="default" onClick={onClose} disabled={loading}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!form.isDirty()}
                  loading={loading}
                >
                  Update
                </Button>
              </Group>
            </Group>
          </Stack>
        </Tabs>
      </form>
    </Modal>
  );
};

export default EditCandidateModal;
