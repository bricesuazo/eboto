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
import type { Candidate, Partylist, Position } from "@prisma/client";
import { hasLength, useForm } from "@mantine/form";
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

const EditCandidateModal = ({
  isOpen,
  onClose,
  candidate,
  partylists,
  positions,
}: {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate;
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
  }>({
    initialValues: {
      firstName: candidate.first_name,
      middleName: candidate.middle_name,
      lastName: candidate.last_name,
      slug: candidate.slug,
      partylistId: candidate.partylistId,
      position: candidate.positionId,
      image: candidate.image,
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
      form.reset();
    }
  }, [isOpen]);

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
            });

            setLoading(false);
          })();
        })}
      >
        <Tabs variant="outline" radius="xs" defaultValue="basic">
          <Tabs.List>
            <Tabs.Tab value="basic" icon={<IconUserSearch size="0.8rem" />}>
              Basic Info
            </Tabs.Tab>
            <Tabs.Tab value="image" icon={<IconPhoto size="0.8rem" />}>
              Image
            </Tabs.Tab>
            <Tabs.Tab
              value="credentials"
              icon={<IconInfoCircle size="0.8rem" />}
              disabled
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
          </Stack>
        </Tabs>
      </form>
    </Modal>
  );
};

export default EditCandidateModal;
