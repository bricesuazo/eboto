import { Button, Container, Text } from "@chakra-ui/react";
import Link from "next/link";
import { useRouter } from "next/router";
import Moment from "react-moment";
import { convertNumberToHour } from "../../../utils/convertNumberToHour";
import { api } from "../../../utils/api";

const DashboardOverview = () => {
  const router = useRouter();
  if (typeof router.query.electionSlug !== "string") return null;

  const electionOverview = api.election.getElectionOverview.useQuery(
    router.query.electionSlug,
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    }
  );

  const deleteElectionMutation = api.election.delete.useMutation({
    onSuccess: async () => {
      await router.push("/dashboard");
    },
  });

  return (
    <Container maxW="4xl">
      {electionOverview.isLoading ? (
        <Text>Loading...</Text>
      ) : electionOverview.isError ? (
        <Text>Error: {electionOverview.error.message}</Text>
      ) : !electionOverview.data ? (
        <Text>No election found</Text>
      ) : (
        <>
          <Link
            href={
              "/dashboard/" + electionOverview.data.election.slug + "/voter"
            }
          >
            <Button variant="link">voter</Button>
          </Link>
          <Button
            colorScheme="red"
            onClick={() =>
              electionOverview.data &&
              deleteElectionMutation.mutate(electionOverview.data.election.id)
            }
            isLoading={deleteElectionMutation.isLoading}
          >
            Delete
          </Button>
          <Text>{electionOverview.data.election.name}</Text>
          <Text>{electionOverview.data.election.slug}</Text>

          <Text>
            {electionOverview.data.voted._count._all}/
            {electionOverview.data.voters._count._all} voted
          </Text>
          <Text>
            Created:{" "}
            <Moment
              format="MMMM DD, YYYY hh:mm A"
              date={electionOverview.data.election.createdAt}
            />{" "}
            (
            <Moment
              fromNow
              interval={1000}
              date={electionOverview.data.election.createdAt}
            />
            )
          </Text>
          <Text>
            {electionOverview.data.election.publicity.charAt(0) +
              electionOverview.data.election.publicity.slice(1).toLowerCase()}
          </Text>
          <Text>
            {electionOverview.data.positions._count._all} position
            {electionOverview.data.positions._count._all < 1 ? "" : "s"}
          </Text>
          <Text>
            {electionOverview.data.candidates._count._all} candidate
            {electionOverview.data.candidates._count._all < 1 ? "" : "s"}
          </Text>
          <Text>
            Open from{" "}
            {convertNumberToHour(electionOverview.data.election.voting_start)}{" "}
            to {convertNumberToHour(electionOverview.data.election.voting_end)}
          </Text>
        </>
      )}
    </Container>
  );
};

export default DashboardOverview;
