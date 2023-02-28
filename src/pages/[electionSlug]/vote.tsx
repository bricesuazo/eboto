import { Box, Center, Container, Flex, Stack, Text } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { api } from "../../utils/api";

const VotePage = () => {
  const router = useRouter();

  const election = api.election.getElectionData.useQuery(
    router.query.electionSlug as string,
    {
      enabled: router.isReady,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      retry: false,
    }
  );
  return (
    <Container>
      <Stack>
        {election.isLoading ? (
          <Text>Loading...</Text>
        ) : election.isError ? (
          <Text>Error: {election.error.message}</Text>
        ) : !election.data ? (
          <Text>Not found</Text>
        ) : (
          election.data.positions.map((position) => (
            <Box key={position.id}>
              <Text fontSize="xl" fontWeight="medium">
                {position.name}
              </Text>

              <Flex flexWrap="wrap">
                {election.data?.candidates
                  .filter((candidate) => candidate.positionId === position.id)
                  .map((candidate) => (
                    <Center
                      key={candidate.id}
                      w="44"
                      h="24"
                      border="1px"
                      borderColor="GrayText"
                      borderRadius="md"
                    >
                      <Text>
                        {candidate.first_name}{" "}
                        {candidate.middle_name
                          ? candidate.middle_name + " "
                          : ""}
                        {candidate.last_name}(
                        {
                          election.data?.partylist.find(
                            (partylist) =>
                              partylist.id === candidate.partylistId
                          )?.acronym
                        }
                        )
                      </Text>
                    </Center>
                  ))}
              </Flex>
            </Box>
          ))
        )}
      </Stack>
    </Container>
  );
};

export default VotePage;
