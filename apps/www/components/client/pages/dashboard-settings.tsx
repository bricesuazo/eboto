"use client";

import { api_client } from "@/shared/client/trpc";
import { type Election, type Publicity, publicity } from "@eboto-mo/db/schema";
import {
  Alert,
  Box,
  Button,
  Group,
  Modal,
  Select,
  Stack,
  Text,
  TextInput,
  Textarea,
  rem,
} from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import {
  Dropzone,
  type FileWithPath,
  IMAGE_MIME_TYPE,
} from "@mantine/dropzone";
import { hasLength, useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconCalendar,
  IconCheck,
  IconLetterCase,
  IconX,
} from "@tabler/icons-react";
import { IconAlertCircle } from "@tabler/icons-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef } from "react";

export default function DashboardSettings({
  election,
}: {
  election: Election;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { mutate, isLoading, isError, error } =
    api_client.election.editElection.useMutation({
      onSuccess: async () => {
        if (form.values.newSlug !== election.slug) {
          router.push(`/dashboard/${form.values.newSlug}/settings`);
        }

        queryClient.invalidateQueries({ queryKey: ["getAllMyElections"] });

        notifications.show({
          title: "Election settings updated.",
          icon: <IconCheck size="1.1rem" />,
          message: "Your changes have been saved.",
          autoClose: 3000,
        });

        form.resetDirty();
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
  const openRef = useRef<() => void>(null);
  const [opened, { open, close }] = useDisclosure(false);

  const form = useForm<{
    name: string;
    newSlug: string;
    description: string;
    // voter_domain: string | null;
    start_date: Date;
    end_date: Date;
    publicity: Publicity;
    logo: string | null | FileWithPath;
  }>({
    initialValues: {
      name: election.name,
      newSlug: election.slug,
      description: election.description ?? "",
      // voter_domain: null,
      start_date: election.start_date,
      end_date: election.end_date,
      publicity: election.publicity,
      logo: election.logo,
    },
    validateInputOnBlur: true,
    clearInputErrorOnChange: true,
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
      start_date: (value, values) => {
        if (!value) {
          return "Please enter an election start date";
        }
        if (values.end_date && value > values.end_date) {
          return "Start date must be before end date";
        }
      },
      end_date: (value, values) => {
        if (!value) {
          return "Please enter an election end date";
        }
        if (values.start_date && value < values.start_date) {
          return "End date must be after start date";
        }
      },
      // voter_domain: (value) => {
      //   if (
      //     value &&
      //     !/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/.test(
      //       value
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
  });

  const deleteForm = useForm({
    initialValues: {
      name: "",
    },
    validateInputOnBlur: true,
    clearInputErrorOnChange: true,
    validate: {
      name: (value) => {
        if (value !== election.name) {
          return "Election name does not match";
        }
      },
    },
  });

  //   const deleteElectionMutation = api.election.delete.useMutation({
  //     onSuccess: async () => {
  //       await router.push("/dashboard");
  //       notifications.show({
  //         title: "Election deleted.",
  //         message: "Your election has been deleted.",
  //         icon: <IconCheck size="1.1rem" />,
  //         autoClose: 3000,
  //       });
  //     },
  //     onError: (error) => {
  //       notifications.show({
  //         title: "Error",
  //         message: error.message,
  //         color: "red",
  //         autoClose: 3000,
  //       });
  //     },
  //   });

  return (
    <Box h="100%">
      <Modal
        opened={opened}
        onClose={close}
        title={<Text weight={600}>Delete election</Text>}
      >
        <form
        // onSubmit={deleteForm.onSubmit(() =>

        // )}
        >
          <Stack spacing="sm">
            <TextInput
              data-autofocus
              label="Election name"
              withAsterisk
              required
              placeholder="Enter election name to confirm deletion"
              {...deleteForm.getInputProps("name")}
              icon={<IconLetterCase size="1rem" />}
              description={
                <Text
                  sx={{
                    pointerEvents: "none",
                    userSelect: "none",
                  }}
                >
                  Please type{" "}
                  <Text weight="bold" component="span">
                    {election.name}
                  </Text>{" "}
                  to confirm deletion. This action cannot be undone.
                </Text>
              }
            />

            <Group position="right" spacing="xs">
              <Button
                variant="default"
                mr={2}
                onClick={close}
                // disabled={deleteElectionMutation.isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!deleteForm.isValid()}
                // loading={deleteElectionMutation.isLoading}
              >
                Confirm Delete
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <form
        onSubmit={form.onSubmit((values) => {
          mutate({
            id: election.id,
            name: values.name,
            newSlug: values.newSlug,
            description: values.description,
            // voter_domain: values.voter_domain,
            start_date: values.start_date,
            end_date: values.end_date,
            publicity: values.publicity,
            logo: typeof values.logo === "string" ? values.logo : "",
          });

          // await updateElectionMutation.mutateAsync({
          //   id: value.id,
          //   name: value.name,
          //   slug: value.slug,
          //   description: value.description,
          //   // voter_domain: value.voter_domain,
          //   start_date:
          //     value.date[0] ||
          //     new Date(new Date().setDate(new Date().getDate() + 1)),
          //   end_date:
          //     value.date[1] ||
          //     new Date(new Date().setDate(new Date().getDate() + 8)),
          //   voting_start: parseInt(value.voting_start),
          //   voting_end: parseInt(value.voting_end),
          //   publicity: value.publicity,
          //   logo:
          //     typeof value.logo === "string" || value.logo === null
          //       ? value.logo
          //       : await uploadImage({
          //           path:
          //             "/elections/" +
          //             value.id +
          //             "/logo/" +
          //             Date.now().toString(),
          //           image: value.logo,
          //         }),
          // });
        })}
      >
        <Stack spacing="sm">
          <TextInput
            label="Election name"
            withAsterisk
            required
            placeholder="Enter election name"
            {...form.getInputProps("name")}
            icon={<IconLetterCase size="1rem" />}
            disabled={isLoading}
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
            icon={<IconLetterCase size="1rem" />}
            // error={
            //   form.errors.slug ||
            //   (updateElectionMutation.error?.data?.code === "CONFLICT" &&
            //     updateElectionMutation.error?.message)
            // }
            disabled={isLoading}
          />

          <Textarea
            label="Election description"
            description="This will be shown on the election page."
            placeholder="Enter election description"
            {...form.getInputProps("description")}
            icon={<IconLetterCase size="1rem" />}
            minRows={3}
            maxRows={8}
            autosize
            // error={
            //   form.errors.description ||
            //   (updateElectionMutation.error?.data?.code === "CONFLICT" &&
            //     updateElectionMutation.error?.message)
            // }
            disabled={isLoading}
          />

          {/* <TextInput
                    label="Election voter's domain"
                    description={`This will be used to restrict voters to a specific domain. For example, if you set this to "cvsu.edu.ph", only voters with an email address ending with "cvsu.edu.ph" will be able to vote. This is good for school elections (such as CSG Election).`}
                    placeholder="cvsu.edu.ph"
                    {...form.getInputProps("voter_domain")}
                    icon={<IconAt size="1rem" />}
                    error={
                      form.errors.voter_domain ||
                      (updateElectionMutation.error?.data?.code ===
                        "CONFLICT" &&
                        updateElectionMutation.error?.message)
                    }
                    disabled={
                      loading ||
                      isElectionOngoing({
                        election: election.data,
                        withTime: false,
                      })
                    }
                  /> */}

          <DateTimePicker
            valueFormat="MMMM DD, YYYY (dddd) hh:mm A"
            label="Election start date"
            placeholder="Enter election start date"
            description="You can't change the election date once the election has started."
            required
            clearable
            withAsterisk
            popoverProps={{
              withinPortal: true,
              position: "bottom",
            }}
            minDate={new Date(new Date().setDate(new Date().getDate() + 1))}
            firstDayOfWeek={0}
            {...form.getInputProps("start_date")}
            icon={<IconCalendar size="1rem" />}
            // disabled={
            //   loading ||
            //   isElectionOngoing({
            //     election: election.data,
            //     withTime: false,
            //   })
            // }
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
              position: "bottom",
            }}
            minDate={
              form.values.start_date ||
              new Date(new Date().setDate(new Date().getDate() + 1))
            }
            firstDayOfWeek={0}
            {...form.getInputProps("end_date")}
            icon={<IconCalendar size="1rem" />}
            // disabled={
            //   loading ||
            //   isElectionOngoing({
            //     election: election.data,
            //     withTime: false,
            //   })
            // }
          />

          <Select
            label="Election publicity"
            description="Private elections are only visible to you and the other commissioners. Voter elections are visible to voters you invite. Public elections are visible to everyone."
            withAsterisk
            withinPortal
            required
            {...form.getInputProps("publicity")}
            data={publicity.map((p) => ({
              value: p,
              label: p.charAt(0) + p.slice(1).toLowerCase(),
            }))}
            disabled={isLoading}
          />

          <Box>
            <Text
              size="sm"
              weight={500}
              component="label"
              htmlFor="logo"
              inline
            >
              Election logo
            </Text>
            <Stack spacing="xs">
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
                loading={isLoading}
              >
                <Group
                  position="center"
                  spacing="xl"
                  style={{ minHeight: rem(140), pointerEvents: "none" }}
                >
                  {form.values.logo ? (
                    typeof form.values.logo !== "string" && form.values.logo ? (
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
                            src={
                              typeof form.values.logo === "string"
                                ? form.values.logo
                                : URL.createObjectURL(form.values.logo)
                            }
                            alt="Logo"
                            fill
                            sizes="100%"
                            priority
                            style={{ objectFit: "cover" }}
                          />
                        </Box>
                        <Text>{form.values.logo.name}</Text>
                      </Group>
                    ) : (
                      election.logo && (
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
                              src={election.logo}
                              alt="Logo"
                              fill
                              priority
                              style={{ objectFit: "cover" }}
                            />
                          </Box>
                          <Text>Current logo</Text>
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
                        Attach a logo to your election. Max file size is 5MB.
                      </Text>
                    </Box>
                  )}
                  <Dropzone.Reject>
                    <IconX size="3.2rem" stroke={1.5} />
                  </Dropzone.Reject>
                </Group>
              </Dropzone>
              <Group grow>
                <Button
                  variant="light"
                  onClick={() => {
                    form.setValues({
                      ...form.values,
                      logo: election.logo,
                    });
                  }}
                  disabled={
                    typeof form.values.logo === "string" ||
                    !election.logo ||
                    isLoading
                  }
                >
                  Reset logo
                </Button>
                <Button
                  color="red"
                  variant="light"
                  onClick={() => {
                    form.setFieldValue("logo", null);
                  }}
                  disabled={!form.values.logo || isLoading}
                >
                  Delete logo
                </Button>
              </Group>
            </Stack>
          </Box>

          {isError && (
            <Alert
              icon={<IconAlertCircle size="1rem" />}
              title="Error"
              color="red"
            >
              {error.message}
            </Alert>
          )}

          <Group position="apart">
            <Button
              type="submit"
              loading={isLoading}
              disabled={!form.isDirty() || !form.isValid()}
              sx={(theme) => ({
                [theme.fn.largerThan("xs")]: {
                  display: "none",
                },
              })}
            >
              Update
            </Button>
            <Button
              type="submit"
              loading={isLoading}
              disabled={!form.isDirty() || !form.isValid()}
              sx={(theme) => ({
                [theme.fn.smallerThan("xs")]: {
                  display: "none",
                },
              })}
            >
              Update election
            </Button>
            <Button
              variant="outline"
              color="red"
              onClick={open}
              //   loading={deleteElectionMutation.isLoading}
              disabled={isLoading}
              sx={(theme) => ({
                [theme.fn.largerThan("xs")]: {
                  display: "none",
                },
              })}
            >
              Delete
            </Button>
            <Button
              variant="outline"
              color="red"
              onClick={open}
              //   loading={deleteElectionMutation.isLoading}
              disabled={isLoading}
              sx={(theme) => ({
                [theme.fn.smallerThan("xs")]: {
                  display: "none",
                },
              })}
            >
              Delete election
            </Button>
          </Group>
        </Stack>
      </form>
    </Box>
  );
}
