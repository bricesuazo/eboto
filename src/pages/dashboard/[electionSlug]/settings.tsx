import { Alert, Button, Container, Group, Input, Select } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconCheck } from "@tabler/icons-react";
import { useRouter } from "next/router";
import ElectionDashboardHeader from "../../../components/ElectionDashboardHeader";
import { api } from "../../../utils/api";
import { convertNumberToHour } from "../../../utils/convertNumberToHour";

const DashboardSettings = () => {
  const router = useRouter();

  const { electionSlug } = router.query;

  const election = api.election.getElectionSettings.useQuery(
    electionSlug as string,
    {
      enabled: router.isReady,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    }
  );
  const form = useForm({
    initialValues: {
      name: election.data?.name,
      slug: election.data?.slug,
      start_date: election.data?.start_date.toISOString().split("T")[0],
      end_date: election.data?.end_date.toISOString().split("T")[0],
      voting_start: election.data?.voting_start,
      voting_end: election.data?.voting_end,
      publicity: election.data?.publicity,
    },
  });

  const updateElectionMutation = api.election.update.useMutation({
    onSuccess: async (data) => {
      if (electionSlug !== data.slug) {
        await router.push(`/dashboard/${data.slug}/settings`);
      } else {
        await election.refetch();
      }
      notifications.show({
        title: "Election settings updated.",
        icon: <IconCheck size="1.1rem" />,
        message: "Your changes have been saved.",
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
  });

  if (election.isLoading) {
    return <div>Loading...</div>;
  }

  if (election.isError) {
    return <div>Error</div>;
  }

  if (!election.data) {
    return <div>Not found</div>;
  }

  return (
    <Container maw="4xl">
      <ElectionDashboardHeader slug={election.data.slug} />

      <form
        onSubmit={form.onSubmit((value) => {
          void (async () => {
            // await updateElectionMutation.mutateAsync({
            //   id: election.data.id,
            //   name: value.name,
            //   slug: value.slug,
            //   start_date: value.start_date,
            //   end_date: value.end_date,
            //   voting_start: value.voting_start,
            //   voting_end: value.voting_end,
            //   publicity: value.publicity,
            // });
          })();
        })}
      >
        <Input
          placeholder="Enter election name"
          type="text"
          {...form.getInputProps("name")}
        />

        <Input
          placeholder="Enter election slug"
          type="text"
          {...form.getInputProps("slug")}
        />

        <Input type="date" {...form.getInputProps("start_date")} />

        <Input type="date" {...form.getInputProps("end_date")} />

        <Select
          {...form.getInputProps("voting_start")}
          data={[...Array(24).keys()].map((_, i) => ({
            value: i.toString(),
            label: convertNumberToHour(i),
          }))}
        />

        <Select
          {...form.getInputProps("voting_end")}
          data={[...Array(24).keys()].map((_, i) => ({
            value: i.toString(),
            label: convertNumberToHour(i),
          }))}
        />

        {/* <Text
          align="center"
          size="sm"
          opacity={updateElectionMutation.isLoading ? 0.5 : 1}
        >
          {form.values.voting_end - form.values.voting_start} hour
          {form.values.voting_end - form.values.voting_start > 1 ? "s" : ""}
        </Text> */}

        <Select
          {...form.getInputProps("publicity")}
          data={["PRIVATE", "VOTER", "PUBLIC"].map((p) => ({
            value: p,
            label: p,
          }))}
        />

        {updateElectionMutation.error && (
          <Alert title="Error" color="red">
            {updateElectionMutation.error.message}
          </Alert>
        )}

        <Group>
          <Button
            color="blue"
            type="submit"
            loading={updateElectionMutation.isLoading}
          >
            Update
          </Button>
          <Button
            variant="outline"
            color="red"
            onClick={() => deleteElectionMutation.mutate(election.data.id)}
            loading={deleteElectionMutation.isLoading}
          >
            Delete
          </Button>
        </Group>
      </form>
    </Container>
  );
};

export default DashboardSettings;
