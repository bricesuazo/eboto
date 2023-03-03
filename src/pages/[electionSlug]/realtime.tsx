import { Box, Container, Stack, Text } from "@chakra-ui/react";
import type { Election } from "@prisma/client";
import type { GetServerSideProps, GetServerSidePropsContext } from "next";
import Moment from "react-moment";
import { getServerAuthSession } from "../../server/auth";
import { prisma } from "../../server/db";
import { api } from "../../utils/api";

const RealtimePage = ({ election }: { election: Election }) => {
  const positions = api.election.getElectionRealtime.useQuery(election.id, {
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    //   refetchInterval: 1000,
  });

  if (positions.isLoading) return <div>Loading...</div>;
  if (positions.isError) return <div>Error: {positions.error.message}</div>;

  if (!positions.data) return <div>No data</div>;
  return (
    <Container maxW="4xl">
      <Text>{election.name}</Text>

      <h2>Positions</h2>
      <Stack spacing={4}>
        {positions.data.map((position) => (
          <Box key={position.id}>
            <Text>
              {position.name} - {position.vote.length}
            </Text>
            <Stack>
              {position.candidate.map((candidate) => (
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

      if (!commissioner)
        return { redirect: { destination: "/", permanent: false } };
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

      if (!vote) return { redirect: { destination: "/", permanent: false } };
      break;
  }

  return {
    props: {
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
