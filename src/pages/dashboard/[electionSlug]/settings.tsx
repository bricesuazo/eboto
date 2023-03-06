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
import type { Election } from "@prisma/client";
import {
  IconAlertCircle,
  IconCalendar,
  IconCheck,
  IconClock,
  IconLetterCase,
} from "@tabler/icons-react";
import type { GetServerSideProps, GetServerSidePropsContext } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import ElectionDashboardHeader from "../../../components/ElectionDashboardHeader";
import { getServerAuthSession } from "../../../server/auth";
import { prisma } from "../../../server/db";
import { api } from "../../../utils/api";
import { convertNumberToHour } from "../../../utils/convertNumberToHour";
import { useEffect } from "react";

const DashboardSettings = ({ election }: { election: Election }) => {
  const title = `${election.name} | Settings`;
  const router = useRouter();

  const form = useForm({
    initialValues: {
      name: election.name,
      slug: election.slug,
      date: [election.start_date, election.end_date],
      voting_start: election.voting_start.toString(),
      voting_end: election.voting_end.toString(),
      publicity: election.publicity,
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
        await router.replace(router.asPath);
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

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>

      <ElectionDashboardHeader slug={election.slug} />

      <form
        onSubmit={form.onSubmit((value) => {
          updateElectionMutation.mutate({
            id: election.id,
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
              onClick={() => deleteElectionMutation.mutate(election.id)}
              loading={deleteElectionMutation.isLoading}
              disabled={updateElectionMutation.isLoading}
            >
              Delete
            </Button>
          </Group>
        </Stack>
      </form>
    </>
  );
};

export default DashboardSettings;

export const getServerSideProps: GetServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const { electionSlug } = context.query;

  if (!electionSlug || typeof electionSlug !== "string") {
    return {
      notFound: true,
    };
  }

  const session = await getServerAuthSession(context);

  if (!session) {
    return {
      redirect: {
        destination: "/signin",
        permanent: false,
      },
    };
  }

  const election = await prisma.election.findFirst({
    where: {
      slug: electionSlug,
      commissioners: {
        some: {
          userId: session.user.id,
        },
      },
    },
  });

  if (!election) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      election,
    },
  };
};
