import {
  Alert,
  Button,
  Group,
  Select,
  Stack,
  TextInput,
  Text,
  Center,
  Loader,
  Modal,
  rem,
  Box,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { hasLength, useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  IconAlertCircle,
  IconCalendar,
  IconCheck,
  IconClock,
  IconLetterCase,
  IconX,
} from "@tabler/icons-react";
import Head from "next/head";
import { useRouter } from "next/router";
import { api } from "../../../utils/api";
import { convertNumberToHour } from "../../../utils/convertNumberToHour";
import type { ElectionPublicity } from "@prisma/client";
import Link from "next/link";
import { useDidUpdate, useDisclosure } from "@mantine/hooks";
import { isElectionOngoing } from "../../../utils/isElectionOngoing";
import {
  Dropzone,
  type FileWithPath,
  IMAGE_MIME_TYPE,
} from "@mantine/dropzone";
import { useRef, useState } from "react";
import Image from "next/image";
import { uploadImage } from "../../../utils/uploadImage";

const DashboardSettings = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const openRef = useRef<() => void>(null);
  const [opened, { open, close }] = useDisclosure(false);
  const election = api.election.getElectionSettings.useQuery(
    router.query.electionSlug as string,
    {
      enabled: router.isReady,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: false,
    }
  );
  const getMyElectionsContext = api.useContext().election.getMyElections;

  const form = useForm<{
    id: string;
    name: string;
    slug: string;
    date: [Date, Date];
    voting_start: string;
    voting_end: string;
    publicity: ElectionPublicity;
    logo: string | null | FileWithPath;
  }>({
    initialValues: {
      id: "",
      name: "",
      slug: "",
      date: [new Date(), new Date()],
      voting_start: "",
      voting_end: "",
      publicity: "PRIVATE",
      logo: null,
    },
    validateInputOnBlur: true,
    clearInputErrorOnChange: true,
    validate: {
      name: hasLength(
        { min: 3 },
        "Election name must be at least 3 characters"
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

      date: (value) => {
        if (!value[0] || !value[1]) {
          return "Please select a date range";
        }
      },
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
        if (value !== election.data?.name) {
          return "Election name does not match";
        }
      },
    },
  });

  const updateElectionMutation = api.election.update.useMutation({
    onSuccess: async (data) => {
      if (router.query.electionSlug !== data.slug) {
        await router.replace(`/dashboard/${data.slug}/settings`);
      } else {
        await election.refetch();
      }

      await getMyElectionsContext.invalidate();
      form.resetDirty();
      notifications.show({
        title: "Election settings updated.",
        icon: <IconCheck size="1.1rem" />,
        message: "Your changes have been saved.",
        autoClose: 3000,
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

  const deleteElectionMutation = api.election.delete.useMutation({
    onSuccess: async () => {
      await router.push("/dashboard");
      notifications.show({
        title: "Election deleted.",
        message: "Your election has been deleted.",
        icon: <IconCheck size="1.1rem" />,
        autoClose: 3000,
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

  useDidUpdate(() => {
    updateElectionMutation.error?.data?.code === "CONFLICT" &&
      updateElectionMutation.reset();
  }, [form.values.slug]);

  useDidUpdate(() => {
    if (opened) {
      deleteForm.reset();
    }
  }, [opened]);

  useDidUpdate(() => {
    if (election.data) {
      const values = {
        id: election.data.id,
        name: election.data.name,
        slug: election.data.slug,
        date: [election.data.start_date, election.data.end_date],
        voting_start: election.data.voting_start.toString(),
        voting_end: election.data.voting_end.toString(),
        publicity: election.data.publicity,
        logo: election.data.logo,
      } as typeof form.values;

      form.setValues(values);
      form.resetDirty(values);
    }
  }, [election.data]);

  return (
    <>
      <Head>
        <title>Settings | eBoto Mo</title>
      </Head>
      <Box p="md">
        {election.isLoading ? (
          <Center h="100%">
            <Loader size="lg" />
          </Center>
        ) : !election.data ? (
          <Text>
            Election not found. <Link href="/dashboard">Go back</Link>
          </Text>
        ) : election.isError ? (
          <Text>
            {election.error?.message ||
              "An error occurred while loading the election."}
          </Text>
        ) : (
          <>
            <Head>
              <title>{election.data.name} &ndash; Settings | eBoto Mo</title>
            </Head>
            <Modal
              opened={opened}
              onClose={close}
              title={<Text weight={600}>Delete election</Text>}
            >
              <form
                onSubmit={deleteForm.onSubmit(() =>
                  deleteElectionMutation.mutate(form.values.id)
                )}
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
                          {election.data?.name}
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
                      disabled={deleteElectionMutation.isLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={!deleteForm.isValid()}
                      loading={deleteElectionMutation.isLoading}
                    >
                      Confirm Delete
                    </Button>
                  </Group>
                </Stack>
              </form>
            </Modal>

            <form
              onSubmit={form.onSubmit((value) => {
                void (async () => {
                  setLoading(true);
                  await updateElectionMutation.mutateAsync({
                    id: value.id,
                    name: value.name,
                    slug: value.slug,
                    start_date:
                      value.date[0] ||
                      new Date(new Date().setDate(new Date().getDate() + 1)),
                    end_date:
                      value.date[1] ||
                      new Date(new Date().setDate(new Date().getDate() + 8)),
                    voting_start: parseInt(value.voting_start),
                    voting_end: parseInt(value.voting_end),
                    publicity: value.publicity,
                    logo:
                      typeof value.logo === "string" || value.logo === null
                        ? value.logo
                        : await uploadImage({
                            path:
                              "/elections/" +
                              value.id +
                              "/logo/" +
                              Date.now().toString(),
                            image: value.logo,
                          }),
                  });
                  setLoading(false);
                })();
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
                  disabled={loading}
                />

                <TextInput
                  label="Election slug"
                  description={
                    <>
                      This will be used as the URL for your election
                      <br />
                      eboto-mo.com/{form.values.slug || "election-slug"}
                    </>
                  }
                  withAsterisk
                  required
                  placeholder="Enter election slug"
                  {...form.getInputProps("slug")}
                  icon={<IconLetterCase size="1rem" />}
                  error={
                    form.errors.slug ||
                    (updateElectionMutation.error?.data?.code === "CONFLICT" &&
                      updateElectionMutation.error?.message)
                  }
                  disabled={loading}
                />

                <DatePickerInput
                  type="range"
                  label="Election start and end date"
                  placeholder="Enter election date"
                  description="You can't change the election date once the election has started."
                  required
                  withAsterisk
                  popoverProps={{
                    withinPortal: true,
                    position: "bottom",
                  }}
                  minDate={
                    new Date(new Date().setDate(new Date().getDate() + 1))
                  }
                  firstDayOfWeek={0}
                  {...form.getInputProps("date")}
                  icon={<IconCalendar size="1rem" />}
                  disabled={
                    loading ||
                    isElectionOngoing({
                      election: election.data,
                      withTime: false,
                    })
                  }
                />
                <Stack spacing="sm">
                  <Group grow spacing={8}>
                    <Select
                      label="Voting hour start"
                      description="You can't change voting hour start once the election is ongoing."
                      withAsterisk
                      withinPortal
                      required
                      dropdownPosition="bottom"
                      {...form.getInputProps("voting_start")}
                      data={[...Array(24).keys()].map((_, i) => ({
                        label: convertNumberToHour(i),
                        value: i.toString(),
                      }))}
                      icon={<IconClock size="1rem" />}
                      disabled={
                        loading ||
                        isElectionOngoing({
                          election: election.data,
                          withTime: true,
                        })
                      }
                    />
                    <Select
                      dropdownPosition="bottom"
                      label="Voting hour start"
                      description="You can't change voting hour end once the election is ongoing."
                      withAsterisk
                      withinPortal
                      required
                      {...form.getInputProps("voting_end")}
                      data={[...Array(24).keys()].map((_, i) => ({
                        label: convertNumberToHour(i),
                        value: i.toString(),
                        disabled: i <= parseInt(form.values.voting_start),
                      }))}
                      icon={<IconClock size="1rem" />}
                      disabled={
                        loading ||
                        isElectionOngoing({
                          election: election.data,
                          withTime: true,
                        })
                      }
                    />
                  </Group>
                  <Text align="center" size="sm" opacity={loading ? 0.5 : 1}>
                    {parseInt(form.values.voting_end) -
                      parseInt(form.values.voting_start)}{" "}
                    hour
                    {parseInt(form.values.voting_end) -
                      parseInt(form.values.voting_start) >
                    1
                      ? "s"
                      : ""}
                  </Text>
                </Stack>

                <Select
                  label="Election publicity"
                  description="Private elections are only visible to you and the other commissioners. Voter elections are visible to voters you invite. Public elections are visible to everyone."
                  withAsterisk
                  withinPortal
                  required
                  {...form.getInputProps("publicity")}
                  data={["PRIVATE", "VOTER", "PUBLIC"].map((p) => ({
                    value: p,
                    label: p,
                  }))}
                  disabled={loading}
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
                      loading={loading}
                    >
                      <Group
                        position="center"
                        spacing="xl"
                        style={{ minHeight: rem(140), pointerEvents: "none" }}
                      >
                        {form.values.logo ? (
                          typeof form.values.logo !== "string" &&
                          form.values.logo ? (
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
                                />
                              </Box>
                              <Text>{form.values.logo.name}</Text>
                            </Group>
                          ) : (
                            election.data.logo && (
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
                                    src={election.data.logo}
                                    alt="Logo"
                                    fill
                                    priority
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
                              Attach a logo to your election. Max file size is
                              5MB.
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
                          election.data &&
                            form.setValues({
                              ...form.values,
                              logo: election.data.logo,
                            });
                        }}
                        disabled={
                          typeof form.values.logo === "string" ||
                          !election.data.logo ||
                          loading
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
                        disabled={!form.values.logo || loading}
                      >
                        Delete logo
                      </Button>
                    </Group>
                  </Stack>
                </Box>

                {updateElectionMutation.isError &&
                  updateElectionMutation.error?.data?.code !== "CONFLICT" && (
                    <Alert
                      icon={<IconAlertCircle size="1rem" />}
                      title="Error"
                      color="red"
                    >
                      {updateElectionMutation.error?.message}
                    </Alert>
                  )}

                <Group position="apart">
                  <Button
                    type="submit"
                    loading={loading}
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
                    loading={loading}
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
                    loading={deleteElectionMutation.isLoading}
                    disabled={loading}
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
                    loading={deleteElectionMutation.isLoading}
                    disabled={loading || !election.data}
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
          </>
        )}
      </Box>
    </>
  );
};

export default DashboardSettings;
