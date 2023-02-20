import { Button, Container, Text } from "@chakra-ui/react";
import { useRouter } from "next/router";
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
              deleteElectionMutation.mutate(electionOverview.data.id)
            }
            isLoading={deleteElectionMutation.isLoading}
          >
            Delete
          </Button>
          <Text>{electionOverview.data.name}</Text>
          <Text>{electionOverview.data.slug}</Text>
        </>
      )}
    </Container>
  );
};

export default DashboardElection;
