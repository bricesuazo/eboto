import { Button, Container, Text } from "@chakra-ui/react";
import { useRouter } from "next/router";
import Moment from "react-moment";
import { api } from "../../utils/api";

const DashboardElection = () => {
  const router = useRouter();
  if (typeof router.query.electionSlug !== "string") return null;

  const electionOverview = api.election.getElectionOverview.useQuery(
    router.query.electionSlug,
    {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
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
            <Moment format="MMMM DD, YYYY hh:mm A">
              {electionOverview.data.election.createdAt}
            </Moment>{" "}
            (
            <Moment
              fromNow
              interval={
                1000 * 60 // 1 minute
              }
            >
              {electionOverview.data.election.createdAt}
            </Moment>
            )
          </Text>
          <Text>
            {electionOverview.data.positions._count._all} position
            {electionOverview.data.positions._count._all < 1 ? "" : "s"}
          </Text>
          <Text>
            {electionOverview.data.candidates._count._all} candidate
            {electionOverview.data.candidates._count._all < 1 ? "" : "s"}
          </Text>
        </>
      )}
    </Container>
  );
};

export default DashboardElection;
