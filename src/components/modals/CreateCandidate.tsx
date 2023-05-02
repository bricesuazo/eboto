import {
  Modal,
  Stack,
  Button,
  Alert,
  Select,
  Group,
  TextInput,
  Text,
  Tabs,
  rem,
  Box,
  Flex,
  Textarea,
} from "@mantine/core";
import { api } from "../../utils/api";
import type { Partylist, Position } from "@prisma/client";
import { notifications } from "@mantine/notifications";
import {
  IconAlertCircle,
  IconCheck,
  IconFlag,
  IconInfoCircle,
  IconLetterCase,
  IconPhoto,
  IconUserSearch,
  IconX,
  IconPlus,
} from "@tabler/icons-react";
import { hasLength, useForm } from "@mantine/form";
import { useRouter } from "next/router";
import { useDidUpdate } from "@mantine/hooks";
import {
  Dropzone,
  type FileWithPath,
  IMAGE_MIME_TYPE,
} from "@mantine/dropzone";
import { useRef, useState } from "react";
import Image from "next/image";
import { uploadImage } from "../../utils/uploadImage";
import { type DateValue, YearPickerInput } from "@mantine/dates";

const CreateCandidateModal = ({
  isOpen,
  onClose,
  position,
  partylists,
  positions,
}: {
  isOpen: boolean;
  onClose: () => void;
  position: Position;
  partylists: Partylist[];
  positions: Position[];
}) => {
  const context = api.useContext();
  const router = useRouter();
  const openRef = useRef<() => void>(null);
  const [loading, setLoading] = useState(false);

  const uploadImageMutation = api.candidate.uploadImage.useMutation();

  const createCandidateMutation = api.candidate.createSingle.useMutation({
    onSuccess: async (data) => {
      if (form.values.image && typeof form.values.image !== "string") {
        await uploadImageMutation.mutateAsync({
          candidateId: data.id,
          file: await uploadImage({
            path: `elections/${data.electionId}/candidates/${
              data.id
            }/image/${Date.now().toString()}`,
            image: form.values.image,
          }),
        });
      }

      await context.candidate.getAll.invalidate();
      notifications.show({
        title: `${data.first_name} ${data.last_name} created!`,
        message: "Successfully created position",
        icon: <IconCheck size="1.1rem" />,
        autoClose: 5000,
      });
      onClose();
    },
    onError: (error) => {
      notifications.show({
        title: "Error creating candidate",
        message: error.message,
        icon: <IconAlertCircle size="1.1rem" />,
        color: "red",
        autoClose: 5000,
      });
      setLoading(false);
    },
  });

  const form = useForm<{
    firstName: string;
    lastName: string;
    slug: string;
    partylistId: string;
    middleName: string;
    position: string;
    image: FileWithPath | null;

    platforms: {
      title: string;
      description: string;
    }[];

    achievements: {
      name: string;
      year: DateValue;
    }[];
    affiliations: {
      org_name: string;
      org_position: string;
      start_year: DateValue;
      end_year: DateValue;
    }[];
    eventsAttended: {
      name: string;
      year: DateValue;
    }[];
  }>({
    initialValues: {
      firstName: "",
      lastName: "",
      slug: "",
      partylistId: partylists[0]?.id || "",
      middleName: "",
      position: position.id,
      image: null,

      platforms: [],

      achievements: [],
      affiliations: [],
      eventsAttended: [],
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

  useDidUpdate(() => {
    if (isOpen) {
      form.reset();
      createCandidateMutation.reset();
    }
  }, [isOpen]);

  return (
    <Modal
      opened={isOpen || loading}
      onClose={onClose}
      title={<Text weight={600}>Create candidate</Text>}
      closeOnClickOutside={false}
    >
      <form
        onSubmit={form.onSubmit((value) => {
          void (async () => {
            setLoading(true);
            await createCandidateMutation.mutateAsync({
              firstName: value.firstName,
              lastName: value.lastName,
              slug: value.slug,
              partylistId: value.partylistId,
              position: {
                id: value.position,
                electionId: position.electionId,
              },
              middleName: value.middleName,

              platforms: value.platforms.map((p) => ({
                title: p.title,
                description: p.description,
              })),

              achievements: value.achievements.map((a) => ({
                name: a.name,
                year: new Date(a.year?.toDateString() ?? ""),
              })),
              affiliations: value.affiliations.map((a) => ({
                org_name: a.org_name,
                org_position: a.org_position,
                start_year: new Date(a.start_year?.toDateString() ?? ""),
                end_year: new Date(a.end_year?.toDateString() ?? ""),
              })),
              eventsAttended: value.eventsAttended.map((a) => ({
                name: a.name,
                year: new Date(a.year?.toDateString() ?? ""),
              })),
            });
            setLoading(false);
          })();
        })}
      >
        <Tabs radius="xs" defaultValue="basic-info">
          <Tabs.List grow>
            <Tabs.Tab
              value="basic-info"
              icon={<IconUserSearch size="0.8rem" />}
              px="2rem"
            >
              Basic Info
            </Tabs.Tab>
            <Tabs.Tab
              value="image"
              icon={<IconPhoto size="0.8rem" />}
              px="2rem"
            >
              Image
            </Tabs.Tab>
            <Tabs.Tab
              value="platforms"
              icon={<IconInfoCircle size="0.8rem" />}
              px="2rem"
            >
              Platforms
            </Tabs.Tab>
            <Tabs.Tab
              value="credentials"
              icon={<IconInfoCircle size="0.8rem" />}
              px="2rem"
            >
              Credentials
            </Tabs.Tab>
          </Tabs.List>
          <Stack spacing="sm">
            <Tabs.Panel value="basic-info" pt="xs">
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
                >
                  <Group
                    position="center"
                    spacing="xl"
                    style={{ minHeight: rem(140), pointerEvents: "none" }}
                  >
                    {form.values.image ? (
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
                            style={{ objectFit: "cover" }}
                          />
                        </Box>
                        <Text>{form.values.image.name}</Text>
                      </Group>
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
                <Button
                  onClick={() => {
                    form.setFieldValue("image", null);
                  }}
                  disabled={!form.values.image || loading}
                >
                  Delete image
                </Button>
              </Stack>
            </Tabs.Panel>
            <Tabs.Panel value="platforms" pt="xs">
              <Stack spacing="xs">
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

                    <Button
                      variant="outline"
                      mt="xs"
                      size="xs"
                      w="100%"
                      color="red"
                      onClick={() => {
                        form.setValues({
                          ...form.values,

                          platforms: form.values.platforms.filter(
                            (_, i) => i !== index
                          ),
                        });
                      }}
                    >
                      Delete platform
                    </Button>
                  </Box>
                ))}
                <Button
                  leftIcon={<IconPlus size="1.25rem" />}
                  onClick={() => {
                    form.setValues({
                      ...form.values,

                      platforms: [
                        ...form.values.platforms,
                        {
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
                    {form.values.achievements.map((achievement, index) => (
                      <Box key={index}>
                        <Flex gap="xs">
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
                            value={achievement.year}
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
                        <Button
                          variant="outline"
                          mt="xs"
                          size="xs"
                          w="100%"
                          color="red"
                          onClick={() => {
                            form.setValues({
                              ...form.values,

                              achievements: form.values.achievements.filter(
                                (_, i) => i !== index
                              ),
                            });
                          }}
                        >
                          Delete achievement
                        </Button>
                      </Box>
                    ))}

                    <Button
                      leftIcon={<IconPlus size="1.25rem" />}
                      onClick={() => {
                        form.setValues({
                          ...form.values,

                          achievements: [
                            ...form.values.achievements,
                            {
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
                    {form.values.affiliations.map((affiliation, index) => (
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
                            value={affiliation.start_year}
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
                            value={affiliation.end_year}
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
                        <Button
                          variant="outline"
                          mt="xs"
                          size="xs"
                          w="100%"
                          color="red"
                          onClick={() => {
                            form.setValues({
                              ...form.values,

                              affiliations: form.values.affiliations.filter(
                                (_, i) => i !== index
                              ),
                            });
                          }}
                        >
                          Delete affiliation
                        </Button>
                      </Box>
                    ))}

                    <Button
                      leftIcon={<IconPlus size="1.25rem" />}
                      onClick={() => {
                        form.setValues({
                          ...form.values,

                          affiliations: [
                            ...form.values.affiliations,
                            {
                              org_name: "",
                              org_position: "",
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
                    {form.values.eventsAttended.map((eventAttended, index) => (
                      <Box key={index}>
                        <Flex gap="xs">
                          <TextInput
                            w="100%"
                            label="Seminars attended"
                            placeholder="Enter seminars attended"
                            required
                            value={eventAttended.name}
                            onChange={(e) => {
                              form.setValues({
                                ...form.values,
                                eventsAttended: form.values.eventsAttended.map(
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
                            value={eventAttended.year}
                            onChange={(date) => {
                              form.setValues({
                                ...form.values,
                                eventsAttended: form.values.eventsAttended.map(
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
                        <Button
                          variant="outline"
                          mt="xs"
                          size="xs"
                          w="100%"
                          color="red"
                          onClick={() => {
                            form.setValues({
                              ...form.values,

                              eventsAttended: form.values.eventsAttended.filter(
                                (_, i) => i !== index
                              ),
                            });
                          }}
                        >
                          Delete seminar attended
                        </Button>
                      </Box>
                    ))}

                    <Button
                      leftIcon={<IconPlus size="1.25rem" />}
                      onClick={() => {
                        form.setValues({
                          ...form.values,

                          eventsAttended: [
                            ...form.values.eventsAttended,
                            {
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
              <Button variant="default" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!form.isValid() || loading}
                loading={loading}
              >
                Create
              </Button>
            </Group>
          </Stack>
        </Tabs>
      </form>
    </Modal>
  );
};

export default CreateCandidateModal;
