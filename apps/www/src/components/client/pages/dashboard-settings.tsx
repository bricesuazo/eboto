"use client";

import { useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/client";
import { transformUploadImage } from "@/utils";
import {
  Alert,
  Box,
  Button,
  Group,
  InputDescription,
  InputLabel,
  Modal,
  RangeSlider,
  rem,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { Dropzone, DropzoneReject, IMAGE_MIME_TYPE } from "@mantine/dropzone";
import { hasLength, useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconAlertCircle,
  IconCalendar,
  IconCheck,
  IconLetterCase,
  IconX,
} from "@tabler/icons-react";

import type { RouterOutputs } from "@eboto/api";
import { parseHourTo12HourFormat } from "@eboto/constants";
import type { Publicity } from "@eboto/db/schema";
import { publicity } from "@eboto/db/schema";

export default function DashboardSettings({
  election,
}: {
  election: RouterOutputs["election"]["getElectionBySlug"];
}) {
  const getElectionBySlugQuery = api.election.getElectionBySlug.useQuery(
    {
      election_slug: election.slug,
    },
    {
      initialData: election,
    },
  );
  const context = api.useUtils();
  const router = useRouter();
  const openRef = useRef<() => void>(null);
  const editElectionMutation = api.election.edit.useMutation({
    onSuccess: async () => {
      if (form.values.newSlug !== election.slug) {
        router.push(`/dashboard/${form.values.newSlug}/settings`);
      }
      if (form.values.name !== election.name) {
        await context.election.getAllMyElections.invalidate();
      }

      notifications.show({
        title: "Election settings updated.",
        icon: <IconCheck size="1.1rem" />,
        message: "Your changes have been saved.",
        autoClose: 3000,
      });

      const refetchedElection = await getElectionBySlugQuery.refetch();

      form.setValues({
        ...form.values,
        logo: refetchedElection.data?.logo?.url ?? null,
      });
      form.resetDirty({
        ...form.values,
        logo: refetchedElection.data?.logo?.url ?? null,
      });
    },
    onError: (error) => {
      notifications.show({
        title: "Error",
        message: error.message,
        color: "red",
        autoClose: 3000,
      });
    },
  });
  const [opened, { open, close }] = useDisclosure(false);

  const form = useForm<{
    name: string;
    newSlug: string;
    description: string;
    // voter_domain: string | null;
    date: [Date, Date];
    publicity: Publicity;
    logo: File | string | null;
    voting_hours: [number, number];
  }>({
    validateInputOnChange: true,
    validateInputOnBlur: true,
    initialValues: {
      name: getElectionBySlugQuery.data.name,
      newSlug: getElectionBySlugQuery.data.slug,
      description: getElectionBySlugQuery.data.description ?? "",
      // voter_domain: getElectionBySlugQuery.data.voter_domain,
      date: [
        getElectionBySlugQuery.data.start_date,
        getElectionBySlugQuery.data.end_date,
      ],
      publicity: getElectionBySlugQuery.data.publicity,
      voting_hours: [
        getElectionBySlugQuery.data.voting_hour_start,
        getElectionBySlugQuery.data.voting_hour_end,
      ],
      logo: getElectionBySlugQuery.data.logo?.url ?? null,
    },
    validate: {
      name: hasLength(
        { min: 3 },
        "Election name must be at least 3 characters",
      ),
      newSlug: (value) => {
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
      date: (value) => {
        if (!value[0] || !value[1])
          return "Please enter an election start and end date";

        if (value[0].getTime() > value[1].getTime())
          return "Start date must be before end date";

        if (value[1].getTime() < value[0].getTime())
          return "End date must be after start date";
      },
      publicity: (value) => {
        if (!value) {
          return "Please select an election publicity";
        }
      },
      // voter_domain: (value) => {
      //   if (
      //     value &&
      //     !/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/.test(
      //       value,
      //     )
      //   ) {
      //     return "Voter domain must be alphanumeric and can contain dashes";
      //   }

      //   if (value && value.includes(" ")) {
      //     return "Voter domain cannot contain spaces";
      //   }

      //   if (value && value.includes("gmail.com")) {
      //     return "Voter domain cannot be gmail.com";
      //   }
      // },
    },
    transformValues: (values) => {
      const nowStart = new Date(values.date[0]);
      const nowEnd = new Date(values.date[1]);
      return {
        ...values,
        date: [
          new Date(nowStart.setDate(nowStart.getDate() + 1)),
          new Date(nowEnd.setDate(nowEnd.getDate() + 1)),
        ],
      };
    },
  });

  const deleteForm = useForm({
    initialValues: {
      name: "",
    },
    validate: {
      name: (value) => {
        if (value !== election.name) {
          return "Election name does not match";
        }
      },
    },
  });

  const deleteElectionMutation = api.election.delete.useMutation({
    onSuccess: () => {
      router.push("/dashboard");
      notifications.show({
        title: "Election deleted.",
        message: "Your election has been deleted.",
        icon: <IconCheck size="1.1rem" />,
        autoClose: 3000,
      });
      close();
    },
    onError: (error) => {
      notifications.show({
        title: "Error",
        message: error.message,
        color: "red",
        autoClose: 3000,
      });
    },
  });

  return (
    <Box h="100%">
      <Modal
        opened={opened || deleteElectionMutation.isPending}
        onClose={close}
        title={<Text fw={600}>Delete election</Text>}
      >
        <form
          onSubmit={deleteForm.onSubmit(() =>
            deleteElectionMutation.mutate({
              election_id: election.id,
            }),
          )}
        >
          <Stack gap="sm">
            <TextInput
              data-autofocus
              label="Election name"
              withAsterisk
              required
              placeholder="Enter election name to confirm deletion"
              {...deleteForm.getInputProps("name")}
              leftSection={<IconLetterCase size="1rem" />}
              description={
                <Text
                  style={{
                    pointerEvents: "none",
                    userSelect: "none",
                  }}
                >
                  Please type{" "}
                  <Text fw="bold" component="span">
                    {election.name}
                  </Text>{" "}
                  to confirm deletion. This action cannot be undone.
                </Text>
              }
            />

            <Group justify="right" gap="xs">
              <Button
                variant="default"
                mr={2}
                onClick={close}
                disabled={deleteElectionMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!deleteForm.isValid()}
                loading={deleteElectionMutation.isPending}
              >
                Confirm Delete
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <form
        onSubmit={form.onSubmit(
          (values) =>
            void (async () => {
              await editElectionMutation.mutateAsync({
                id: election.id,
                name: values.name,
                newSlug: values.newSlug,
                description: values.description,
                oldSlug: election.slug,
                // voter_domain: values.voter_domain?.length
                //   ? values.voter_domain
                //   : null,
                date: values.date,
                publicity: values.publicity,
                voting_hours: values.voting_hours,
                logo:
                  typeof values.logo !== "string"
                    ? values.logo !== null
                      ? await transformUploadImage(values.logo)
                      : null
                    : undefined,
              });
            })(),
        )}
      >
        <Stack gap="sm">
          <TextInput
            label="Election name"
            withAsterisk
            required
            placeholder="Enter election name"
            {...form.getInputProps("name")}
            leftSection={<IconLetterCase size="1rem" />}
            disabled={editElectionMutation.isPending}
          />

          <TextInput
            label="Election slug"
            description={
              <>
                This will be used as the URL for your election
                <br />
                eboto-mo.com/{form.values.newSlug || "election-slug"}
              </>
            }
            withAsterisk
            required
            placeholder="Enter election slug"
            {...form.getInputProps("newSlug")}
            leftSection={<IconLetterCase size="1rem" />}
            error={
              form.errors.slug ??
              (editElectionMutation.error?.data?.code === "CONFLICT" &&
                editElectionMutation.error?.message)
            }
            disabled={editElectionMutation.isPending}
          />

          <Textarea
            label="Election description"
            description="This will be shown on the election page."
            placeholder="Enter election description"
            {...form.getInputProps("description")}
            leftSection={<IconLetterCase size="1rem" />}
            minRows={3}
            maxRows={8}
            autosize
            error={
              form.errors.description ??
              (editElectionMutation.error?.data?.code === "CONFLICT" &&
                editElectionMutation.error?.message)
            }
            disabled={editElectionMutation.isPending}
          />

          {/* <TextInput
            label="Election voter's domain"
            description={`This will be used to restrict voters to a specific domain. For example, if you set this to "cvsu.edu.ph", only voters with an email address ending with "cvsu.edu.ph" will be able to vote. This is good for school-wide elections (such as CSG Election).`}
            placeholder="Domain name (e.g. cvsu.edu.ph)"
            {...form.getInputProps("voter_domain")}
            leftSection={<IconAt size="1rem" />}
            error={
              form.errors.voter_domain ??
              (editElectionMutation.error?.data?.code === "CONFLICT" &&
                editElectionMutation.error?.message)
            }
            disabled={
              editElectionMutation.isPending ||
              isElectionOngoing({
                election: getElectionBySlugQuery.data,
              }) ||
              isElectionEnded({
                election: getElectionBySlugQuery.data,
              })
            }
          /> */}

          <DatePickerInput
            type="range"
            allowSingleDateInRange
            label="Election start and end date"
            // placeholder="Enter election start and end date"
            description="You can't change the election date once the election has started and ended."
            leftSection={<IconCalendar size="1rem" />}
            minDate={new Date(new Date().setDate(new Date().getDate() + 1))}
            firstDayOfWeek={0}
            required
            disabled={
              editElectionMutation.isPending ||
              getElectionBySlugQuery.data.start_date.getTime() < Date.now()
            }
            {...form.getInputProps("date")}
          />

          <Box>
            <InputLabel required>Voting Hours</InputLabel>
            <InputDescription>
              Voters can only vote within the specified hours (
              {form.values.voting_hours[0] === 0 &&
              form.values.voting_hours[1] === 24
                ? "Whole day"
                : parseHourTo12HourFormat(form.values.voting_hours[0]) +
                  " - " +
                  parseHourTo12HourFormat(form.values.voting_hours[1])}
              )
            </InputDescription>
            <RangeSlider
              step={1}
              max={24}
              min={0}
              minRange={1}
              maxRange={24}
              marks={[
                { value: 7, label: "7AM" },
                { value: 19, label: "7PM" },
              ]}
              label={parseHourTo12HourFormat}
              disabled={
                editElectionMutation.isPending ||
                getElectionBySlugQuery.data.start_date.getTime() < Date.now()
              }
              {...form.getInputProps("voting_hours")}
            />
          </Box>

          <Select
            label="Election publicity"
            description="Private elections are only visible to you and the other commissioners. Voter elections are visible to voters you invite. Public elections are visible to everyone."
            withAsterisk
            comboboxProps={{
              withinPortal: true,
            }}
            required
            {...form.getInputProps("publicity")}
            data={publicity.map((p) => ({
              value: p,
              label: p.charAt(0) + p.slice(1).toLowerCase(),
            }))}
            disabled={editElectionMutation.isPending}
          />

          <Box>
            <Text size="sm" fw={500} component="label" htmlFor="logo" inline>
              Election logo
            </Text>
            <Stack gap="xs">
              <Dropzone
                id="logo"
                onDrop={(files) => {
                  if (!files[0]) return;
                  form.setFieldValue("logo", files[0]);
                }}
                openRef={openRef}
                maxSize={5 * 1024 ** 2}
                accept={IMAGE_MIME_TYPE}
                multiple={false}
                loading={editElectionMutation.isPending}
              >
                <Group
                  justify="center"
                  gap="xl"
                  style={{ minHeight: rem(140), pointerEvents: "none" }}
                >
                  {form.values.logo && typeof form.values.logo !== "string" ? (
                    <Box
                      pos="relative"
                      style={() => ({
                        width: rem(120),
                        height: rem(120),
                      })}
                    >
                      <Image
                        src={URL.createObjectURL(form.values.logo)}
                        alt="Logo"
                        fill
                        sizes="100%"
                        priority
                        style={{ objectFit: "cover" }}
                      />
                    </Box>
                  ) : typeof form.values.logo === "string" ? (
                    <Group>
                      <Box
                        pos="relative"
                        style={() => ({
                          width: rem(120),
                          height: rem(120),
                        })}
                      >
                        <Image
                          src={form.values.logo}
                          alt="Logo"
                          fill
                          sizes="100%"
                          priority
                          style={{ objectFit: "cover" }}
                        />
                      </Box>
                      <Text>Current logo</Text>
                    </Group>
                  ) : (
                    <Box>
                      <Text size="xl" inline ta="center">
                        Drag image here or click to select image
                      </Text>
                      <Text size="sm" c="dimmed" inline mt={7} ta="center">
                        Attach a logo to your election. Max file size is 5MB.
                      </Text>
                    </Box>
                  )}
                  <DropzoneReject>
                    <IconX size="3.2rem" stroke={1.5} />
                  </DropzoneReject>
                </Group>
              </Dropzone>
              <Group grow>
                <Button
                  variant="light"
                  onClick={() => {
                    form.setValues({
                      ...form.values,
                      logo: getElectionBySlugQuery.data.logo?.url ?? null,
                    });
                  }}
                  disabled={
                    form.values.logo ===
                      (getElectionBySlugQuery.data.logo?.url ?? null) ||
                    editElectionMutation.isPending
                  }
                >
                  Reset logo
                </Button>
                <Button
                  color="red"
                  variant="light"
                  onClick={() => {
                    form.setValues({ logo: null });
                  }}
                  disabled={!form.values.logo || editElectionMutation.isPending}
                >
                  Delete logo
                </Button>
              </Group>
            </Stack>
          </Box>

          {editElectionMutation.isError && (
            <Alert
              icon={<IconAlertCircle size="1rem" />}
              title="Error"
              color="red"
            >
              {editElectionMutation.error.message}
            </Alert>
          )}

          <Group justify="space-between">
            <Button
              type="submit"
              loading={editElectionMutation.isPending}
              disabled={!form.isDirty() || !form.isValid()}
              hiddenFrom="sm"
            >
              Update
            </Button>
            <Button
              type="submit"
              loading={editElectionMutation.isPending}
              disabled={!form.isDirty() || !form.isValid()}
              visibleFrom="sm"
            >
              Update election
            </Button>
            <Button
              variant="outline"
              color="red"
              onClick={open}
              disabled={editElectionMutation.isPending}
            >
              Delete election
            </Button>
          </Group>
        </Stack>
      </form>
    </Box>
  );
}
