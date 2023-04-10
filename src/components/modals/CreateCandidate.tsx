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
  }>({
    initialValues: {
      firstName: "",
      lastName: "",
      slug: "",
      partylistId: partylists[0]?.id || "",
      middleName: "",
      position: position.id,
      image: null,
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
            <Tabs.Panel value="credentials" pt="xs">
              <Tabs variant="outline" radius="xs" defaultValue="achievements">
                <Tabs.List grow>
                  <Tabs.Tab value="achievements">
                    <Text size="xs" truncate>
                      Achievements
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
                  achievements
                </Tabs.Panel>
                <Tabs.Panel value="affiliations" pt="xs">
                  affiliations
                </Tabs.Panel>
                <Tabs.Panel value="events-attended" pt="xs">
                  events-attended
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
                disabled={!form.isValid()}
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
