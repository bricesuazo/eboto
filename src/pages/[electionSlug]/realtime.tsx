import { Box, Container, Stack, Text } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { api } from "../../utils/api";

const RealtimePage = () => {
  const router = useRouter();

  const election = api.election.getElectionRealtime.useQuery(
    router.query.electionSlug as string,
    {
      enabled: router.isReady,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      //   refetchInterval: 1000,
    }
  );

  if (election.isLoading) return <div>Loading...</div>;
  if (election.isError) return <div>Error: {election.error.message}</div>;

  if (!election.data) return <div>No data</div>;
  return (
    <Container maxW="4xl">
      <Text>{election.data.name}</Text>

      <h2>Positions</h2>
      <Stack spacing={4}>
        {election.data.positions.map((position) => (
          <Box key={position.id}>
            <Text>
              {position.name} - {position.vote.length}
            </Text>
            <Stack>
              {election.data.candidates
                .filter((candidate) => candidate.positionId === position.id)
                .map((candidate) => (
                  <Box key={candidate.id}>
                    - {candidate.first_name} - {candidate.vote.length}
                  </Box>
                ))}
            </Stack>
          </Box>
        ))}
      </Stack>
    </Container>
  );
};

export default RealtimePage;
