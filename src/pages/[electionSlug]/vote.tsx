import {
  Button,
  Center,
  Container,
  Stack,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import type { Election } from "@prisma/client";
import type { GetServerSideProps, GetServerSidePropsContext } from "next";
import { useState } from "react";
import ConfirmVote from "../../components/modals/ConfirmVote";
import VotingPosition from "../../components/VotingPosition";
import { getServerAuthSession } from "../../server/auth";
import { prisma } from "../../server/db";
import { api } from "../../utils/api";

const VotePage = ({ election }: { election: Election }) => {
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const positions = api.election.getElectionVoting.useQuery(election.id, {
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false,
  });
  if (positions.isLoading) return <Text>Loading...</Text>;

  if (positions.isError) return <Text>Error:{positions.error.message}</Text>;

  if (!positions.data) return <Text>Not found</Text>;

  return (
    <>
      <ConfirmVote
        isOpen={isOpen}
        onClose={onClose}
        election={election}
        positions={positions.data}
        selectedCandidates={selectedCandidates}
      />
      <Container>
        <Stack>
          {positions.data.map((position) => {
            return (
              <VotingPosition
                key={position.id}
                position={position}
                setSelectedCandidates={setSelectedCandidates}
              />
            );
          })}
        </Stack>

        <Center
          paddingX={[4, 0]}
          position="sticky"
          bottom={12}
          zIndex="sticky"
          marginTop={16}
        >
          <Button
            isDisabled={positions.data.length !== selectedCandidates.length}
            onClick={onOpen}
            variant="solid"
            // leftIcon={<FingerPrintIcon width={22} />}

            borderRadius="full"
          >
            Cast Vote
          </Button>
        </Center>
      </Container>
    </>
  );
};

export default VotePage;

export const getServerSideProps: GetServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  if (
    !context.query.electionSlug ||
    typeof context.query.electionSlug !== "string"
  )
    return { notFound: true };

  const session = await getServerAuthSession(context);
  const electionQuery = await prisma.election.findFirst({
    where: {
      slug: context.query.electionSlug,
    },
  });

  if (!electionQuery) return { notFound: true };

  const election = {
    ...electionQuery,
    start_date: electionQuery.start_date.toISOString(),
    end_date: electionQuery.end_date.toISOString(),
    createdAt: electionQuery.createdAt.toISOString(),
    updatedAt: electionQuery.updatedAt.toISOString(),
  };

  if (election.publicity === "PRIVATE") {
    if (!session)
      return { redirect: { destination: "/signin", permanent: false } };

    const commissioner = await prisma.commissioner.findFirst({
      where: {
        electionId: election.id,
        userId: session.user.id,
      },
    });

    if (!commissioner) return { notFound: true };

    return {
      redirect: {
        destination: `/${election.slug}/realtime`,
        permanent: false,
      },
    };
  } else if (election.publicity === "VOTER") {
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
        redirect: {
          destination: `/${election.slug}/realtime`,
          permanent: false,
        },
      };
  } else if (election.publicity === "PUBLIC") {
    const vote = await prisma.vote.findFirst({
      where: {
        electionId: election.id,
      },
    });

    if (!session)
      return {
        redirect: {
          destination: `/${election.slug}`,
          permanent: false,
        },
      };

    if (vote)
      return {
        redirect: {
          destination: `/${election.slug}/realtime`,
          permanent: false,
        },
      };
  }

  return {
    props: {
      election,
    },
  };
};
