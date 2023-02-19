import { Container, Text } from "@chakra-ui/react";
import type { GetServerSidePropsContext } from "next";
import { api } from "../../utils/api";

const DashboardElection = ({ slug }: { slug: string }) => {
  const electionOverview = api.election.getElectionOverview.useQuery(slug, {
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  if (electionOverview.isLoading) return <Text>Loading...</Text>;

  if (!electionOverview.data) return <Text>No election found</Text>;

  return (
    <Container maxW="4xl">
      <Text>{electionOverview.data.name}</Text>
    </Container>
  );
};

export default DashboardElection;

export const getServerSideProps = (context: GetServerSidePropsContext) => {
  return {
    props: {
      slug: context.query.electionSlug,
    },
  };
};
