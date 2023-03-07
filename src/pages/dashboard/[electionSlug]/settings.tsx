import {
  Alert,
  Button,
  Group,
  Select,
  Stack,
  TextInput,
  Text,
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
} from "@tabler/icons-react";
import Head from "next/head";
import { useRouter } from "next/router";
import { api } from "../../../utils/api";
import { convertNumberToHour } from "../../../utils/convertNumberToHour";
import { useEffect } from "react";
import type { ElectionPublicity } from "@prisma/client";
import Link from "next/link";

const DashboardSettings = () =>
  // { election }: { election: Election }
  {
    const router = useRouter();
    const election = api.election.getElectionSettings.useQuery(
      router.query.electionSlug as string,
      {
        enabled: router.isReady,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        retry: false,
      }
    );

    const form = useForm({
      initialValues: {
        id: "",
        name: "",
        slug: "",
        date: [new Date(), new Date()],
        voting_start: "",
        voting_end: "",
        publicity: "PRIVATE" as ElectionPublicity,
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

    const updateElectionMutation = api.election.update.useMutation({
      onSuccess: async (data) => {
        if (router.query.electionSlug !== data.slug) {
          await router.replace(`/dashboard/${data.slug}/settings`);
        } else {
          await election.refetch();
        }

        if (election.data?.name !== data.name) {
          router.reload();
        }

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

    useEffect(() => {
      updateElectionMutation.error?.data?.code === "CONFLICT" &&
        updateElectionMutation.reset();
    }, [form.values.slug]);

    useEffect(() => {
      if (election.data) {
        const values = {
          id: election.data.id,
          name: election.data.name,
          slug: election.data.slug,
          date: [election.data.start_date, election.data.end_date],
          voting_start: election.data.voting_start.toString(),
          voting_end: election.data.voting_end.toString(),
          publicity: election.data.publicity,
        } as typeof form.values;

        form.setValues(values);
        form.resetDirty(values);
      }
    }, [election.data]);

    return (
      <>
        <Head>
          <title>
            {election.data?.name
              ? election.data.name + " - Settings | eBoto Mo"
              : "Settings | eBoto Mo"}
          </title>
        </Head>

        {!election.isLoading && !election.data && !form.values.id ? (
          <Text>
            Election not found. <Link href="/dashboard">Go back</Link>
          </Text>
        ) : election.isError ? (
          <Text>
            {election.error?.message ||
              "An error occurred while loading the election."}
          </Text>
        ) : election.isLoading || !form.values.id ? (
          <Text>Loading...</Text>
        ) : (
          <form
            onSubmit={form.onSubmit((value) => {
              updateElectionMutation.mutate({
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
              });
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
                disabled={updateElectionMutation.isLoading}
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
                disabled={updateElectionMutation.isLoading}
              />

              <DatePickerInput
                type="range"
                label="Election start and end date"
                placeholder="Enter election date"
                description="Select a date range for your election"
                required
                withAsterisk
                popoverProps={{
                  withinPortal: true,
                  position: "bottom",
                }}
                minDate={new Date(new Date().setDate(new Date().getDate() + 1))}
                firstDayOfWeek={0}
                {...form.getInputProps("date")}
                icon={<IconCalendar size="1rem" />}
                disabled={updateElectionMutation.isLoading}
              />
              <Stack spacing="sm">
                <Group grow spacing={8}>
                  <Select
                    label="Voting hour start"
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
                    disabled={updateElectionMutation.isLoading}
                  />
                  <Select
                    dropdownPosition="bottom"
                    label="Voting hour start"
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
                    disabled={updateElectionMutation.isLoading}
                  />
                </Group>
                <Text
                  align="center"
                  size="sm"
                  opacity={updateElectionMutation.isLoading ? 0.5 : 1}
                >
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
                {...form.getInputProps("publicity")}
                data={["PRIVATE", "VOTER", "PUBLIC"].map((p) => ({
                  value: p,
                  label: p,
                }))}
                disabled={updateElectionMutation.isLoading}
              />

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
                  color="blue"
                  type="submit"
                  loading={updateElectionMutation.isLoading}
                  disabled={!form.isDirty() || !form.isValid()}
                >
                  Update
                </Button>
                <Button
                  variant="outline"
                  color="red"
                  onClick={() => deleteElectionMutation.mutate(form.values.id)}
                  loading={deleteElectionMutation.isLoading}
                  disabled={updateElectionMutation.isLoading}
                >
                  Delete
                </Button>
              </Group>
            </Stack>
          </form>
        )}
      </>
    );
  };

export default DashboardSettings;

// export const getServerSideProps: GetServerSideProps = async (
//   context: GetServerSidePropsContext
// ) => {
//   const { electionSlug } = context.query;

//   if (!electionSlug || typeof electionSlug !== "string") {
//     return {
//       notFound: true,
//     };
//   }

//   const session = await getServerAuthSession(context);

//   if (!session) {
//     return {
//       redirect: {
//         destination: "/signin",
//         permanent: false,
//       },
//     };
//   }

//   const election = await prisma.election.findFirst({
//     where: {
//       slug: electionSlug,
//       commissioners: {
//         some: {
//           userId: session.user.id,
//         },
//       },
//     },
//   });

//   if (!election) {
//     return {
//       notFound: true,
//     };
//   }

//   return {
//     props: {
//       election,
//     },
//   };
// };
