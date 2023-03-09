import { Box, Button, Center, Container, Stack, Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import type { Election } from "@prisma/client";
import { IconCheck, IconX } from "@tabler/icons-react";
import type { GetServerSideProps, GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import { useState } from "react";
// import ConfirmVote from "../../components/modals/ConfirmVote";
import VotingPosition from "../../components/VotingPosition";
import { useConfetti } from "../../lib/confetti";
import { getServerAuthSession } from "../../server/auth";
import { prisma } from "../../server/db";
import { api } from "../../utils/api";
import { isElectionOngoing } from "../../utils/isElectionOngoing";

const VotePage = ({ election }: { election: Election }) => {
  const router = useRouter();
  const { fireConfetti } = useConfetti();
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);

  const positions = api.election.getElectionVoting.useQuery(election.id, {
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false,
  });

  const voteMutation = api.election.vote.useMutation();
  if (positions.isLoading) return <Text>Loading...</Text>;

  if (positions.isError) return <Text>Error:{positions.error.message}</Text>;

  if (!positions.data) return <Text>Not found</Text>;

  const openModal = () =>
    modals.openConfirmModal({
      title: "Confirm Vote",
      children: (
        <>
          {positions.data.map((position) => {
            const candidate = position.candidate.find(
              (candidate) =>
                candidate.id ===
                selectedCandidates
                  .find(
                    (selectedCandidate) =>
                      selectedCandidate.split("-")[0] === position.id
                  )
                  ?.split("-")[1]
            );

            return (
              <Box key={position.id}>
                <Text size="sm" color="gray.500">
                  {position.name}
                </Text>
                <Text weight="bold">
                  {candidate
                    ? `${candidate.last_name}, ${candidate.first_name}${
                        candidate.middle_name ? ` ${candidate.middle_name}` : ""
                      } (${candidate.partylist.acronym})`
                    : "Abstain"}
                </Text>
              </Box>
            );
          })}
        </>
      ),
      labels: { confirm: "Confirm", cancel: "Cancel" },
      onConfirm: () => {
        void (async () => {
          await router.push(`/${election.slug}/realtime`);
          notifications.show({
            title: "Vote casted successfully!",
            message: "You can now view the realtime results",
            icon: <IconCheck size="1.1rem" />,
            autoClose: 5000,
          });
          await fireConfetti();
        })();
      },
      onError: () => {
        notifications.show({
          title: "Error casting vote",
          message: voteMutation.error?.message,
          icon: <IconX size="1.1rem" />,
          color: "red",
          autoClose: 5000,
        });
      },
      cancelProps: {
        disabled: true,
      },
      confirmProps: {
        loading: true,
      },
    });

  return (
    <>
      {/* <ConfirmVote
        isOpen={opened}
        onClose={close}
        election={election}
        positions={positions.data}
        selectedCandidates={selectedCandidates}
      /> */}
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

        <Center>
          <Button
            disabled={positions.data.length !== selectedCandidates.length}
            onClick={openModal}
            variant="solid"
            // leftIcon={<FingerPrintIcon w={22} />}
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
  const election = await prisma.election.findFirst({
    where: {
      slug: context.query.electionSlug,
    },
  });

  if (!election) return { notFound: true };

  if (!isElectionOngoing(election))
    return {
      redirect: {
        destination: `/${election.slug}`,
        permanent: false,
      },
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
    if (!session)
      return {
        redirect: { destination: `/${election.slug}`, permanent: false },
      };

    const vote = await prisma.vote.findFirst({
      where: {
        electionId: election.id,
        voterId: session.user.id,
      },
    });

    if (vote)
      return {
        redirect: {
          destination: `/${election.slug}`,
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
