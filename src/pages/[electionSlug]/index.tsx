import {
  Box,
  Button,
  Center,
  Container,
  Flex,
  Stack,
  Text,
} from "@chakra-ui/react";
import type { Election } from "@prisma/client";
import type { GetServerSideProps, GetServerSidePropsContext } from "next";
import Link from "next/link";
import Moment from "react-moment";
import { getServerAuthSession } from "../../server/auth";
import { prisma } from "../../server/db";
import { api } from "../../utils/api";
import { convertNumberToHour } from "../../utils/convertNumberToHour";

const ElectionPage = ({
  election,
  hasVoted,
}: {
  election: Election;
  hasVoted: boolean;
}) => {
  const positions = api.election.getElectionVotingPageData.useQuery(
    election.id,
    {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      retry: false,
    }
  );

  return (
    <Container maxW="4xl">
      {positions.isLoading ? (
        <Text>Loading...</Text>
      ) : positions.isError ? (
        <Text>Error: {positions.error.message}</Text>
      ) : !positions.data ? (
        <Text>Not found</Text>
      ) : (
        <Stack spacing={8} textAlign="center">
          <Box>
            <Text fontSize="2xl" fontWeight="bold">
              {election.name}
            </Text>

            <Text>
              <Moment format="MMMM DD, YYYY hA" date={election.start_date} />
              {" - "}
              <Moment format="MMMM DD, YYYY hA" date={election.end_date} />
            </Text>
            <Text>
              Open from {convertNumberToHour(election.voting_start)} to{" "}
              {convertNumberToHour(election.voting_end)}
            </Text>

            {!hasVoted && (
              <Button as={Link} href={`/${election.slug}/vote`}>
                Vote now!
              </Button>
            )}
          </Box>

          <Stack>
            {positions.data.map((position) => (
              <Box key={position.id}>
                <Text fontSize="xl" fontWeight="medium">
                  {position.name}
                </Text>

                <Flex flexWrap="wrap">
                  {position.candidate.map((candidate) => (
                    <Center
                      as={Link}
                      href={`/${election?.slug || ""}/${candidate.slug}`}
                      w="44"
                      h="24"
                      border="1px"
                      borderColor="GrayText"
                      borderRadius="md"
                      key={candidate.id}
                    >
                      <Text>
                        {candidate.first_name}{" "}
                        {candidate.middle_name
                          ? candidate.middle_name + " "
                          : ""}
                        {candidate.last_name} ({candidate.partylist.acronym})
                      </Text>
                    </Center>
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

export const getServerSideProps: GetServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  if (
    !context.query.electionSlug ||
    typeof context.query.electionSlug !== "string"
  )
    return { notFound: true };

  const session = await getServerAuthSession(context);
  const election = await prisma.election.findFirst({
    where: {
      slug: context.query.electionSlug,
    },
  });

  if (!election) return { notFound: true };

  switch (election.publicity) {
    case "PRIVATE":
      if (!session)
        return { redirect: { destination: "/signin", permanent: false } };

      const commissioner = await prisma.commissioner.findFirst({
        where: {
          electionId: election.id,
          userId: session.user.id,
        },
      });

      if (!commissioner) return { notFound: true };
      break;
    case "VOTER":
      if (!session)
        return { redirect: { destination: "/signin", permanent: false } };

      const vote = await prisma.vote.findFirst({
        where: {
          voterId: session.user.id,
          electionId: election.id,
        },
      });

      if (vote)
        return {
          props: {
            hasVoted: true,
            election: {
              ...election,
              start_date: election.start_date.toISOString(),
              end_date: election.end_date.toISOString(),
              createdAt: election.createdAt.toISOString(),
              updatedAt: election.updatedAt.toISOString(),
            },
          },
        };

      break;
  }

  return {
    props: {
      hasVoted: false,
      election: {
        ...election,
        start_date: election.start_date.toISOString(),
        end_date: election.end_date.toISOString(),
        createdAt: election.createdAt.toISOString(),
        updatedAt: election.updatedAt.toISOString(),
      },
    },
  };
};
