import { Container, Text } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { api } from "../../utils/api";

const DashboardElection = () => {
  const { electionSlug: slug } = useRouter().query;
  if (typeof slug !== "string") return null;

  const electionOverview = api.election.getElectionOverview.useQuery(slug, {
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  return (
    <Container maxW="4xl">
      {electionOverview.isLoading ? (
        <Text>Loading...</Text>
      ) : !electionOverview.data ? (
        <Text>No election found</Text>
      ) : electionOverview.data ? (
        <Text>{electionOverview.data.name}</Text>
      ) : null}
    </Container>
  );
};

export default DashboardElection;
