import { Box, Button, Container, Flex, Stack, Text } from "@chakra-ui/react";
import Link from "next/link";
import { useRouter } from "next/router";
import Moment from "react-moment";
import { api } from "../utils/api";
import { convertNumberToHour } from "../utils/convertNumberToHour";

const ElectionPage = () => {
  const { electionSlug } = useRouter().query;
  const election = api.election.getElectionData.useQuery(
    electionSlug as string,
    {
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
            <Link href={`https://eboto-mo.com/${election.data.slug}`}>
              <Button variant="link">
                https://eboto-mo.com/{election.data.slug}
              </Button>
            </Link>
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
                      <Box key={candidate.id}>
                        <Text>
                          {candidate.first_name}{" "}
                          {candidate.middle_name
                            ? candidate.middle_name + " "
                            : ""}
                          {candidate.last_name}({candidate.partylistId})
                        </Text>
                      </Box>
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
