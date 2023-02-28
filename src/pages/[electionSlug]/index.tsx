import {
  Box,
  Button,
  Center,
  Container,
  Flex,
  Stack,
  Text,
} from "@chakra-ui/react";
import Link from "next/link";
import { useRouter } from "next/router";
import Moment from "react-moment";
import { api } from "../../utils/api";
import { convertNumberToHour } from "../../utils/convertNumberToHour";

const ElectionPage = () => {
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
    <Container maxW="4xl">
      {election.isLoading ? (
        <Text>Loading...</Text>
      ) : election.isError ? (
        <Text>Error: {election.error.message}</Text>
      ) : !election.data ? (
        <Text>Not found</Text>
      ) : (
        <Stack spacing={8} textAlign="center">
          <Box>
            <Text fontSize="2xl" fontWeight="bold">
              {election.data.name}
            </Text>

            <Text>
              <Moment
                format="MMMM DD, YYYY hA"
                date={election.data.start_date}
              />
              {" - "}
              <Moment format="MMMM DD, YYYY hA" date={election.data.end_date} />
            </Text>
            <Text>
              Open from {convertNumberToHour(election.data.voting_start)} to{" "}
              {convertNumberToHour(election.data.voting_end)}
            </Text>

            <Link href={`/${election.data.slug}/vote`}>
              <Button>Vote now!</Button>
            </Link>
          </Box>

          <Stack>
            {election.data.positions.map((position) => (
              <Box key={position.id}>
                <Text fontSize="xl" fontWeight="medium">
                  {position.name}
                </Text>

                <Flex flexWrap="wrap">
                  {election.data?.candidates
                    .filter((candidate) => candidate.positionId === position.id)
                    .map((candidate) => (
                      <Link
                        href={`/${election.data?.slug || ""}/${candidate.slug}`}
                        key={candidate.id}
                      >
                        <Center
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
                      </Link>
                    ))}
                </Flex>
              </Box>
            ))}
          </Stack>
        </Stack>
      )}
    </Container>
  );
};

export default ElectionPage;
