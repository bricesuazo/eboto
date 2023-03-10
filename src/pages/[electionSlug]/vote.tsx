import {
  Box,
  Button,
  Center,
  Container,
  Stack,
  Text,
  Radio,
  Modal,
  Group,
  Alert,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import type { Election } from "@prisma/client";
import {
  IconAlertCircle,
  IconCheck,
  IconFingerprint,
  IconX,
} from "@tabler/icons-react";
import type { GetServerSideProps, GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import { useState } from "react";
import { useConfetti } from "../../lib/confetti";
import { getServerAuthSession } from "../../server/auth";
import { prisma } from "../../server/db";
import { api } from "../../utils/api";
import { isElectionOngoing } from "../../utils/isElectionOngoing";

const VotePage = ({ election }: { election: Election }) => {
  const router = useRouter();
  const { fireConfetti } = useConfetti();
  const [votes, setVotes] = useState<string[]>([]);
  const [opened, { open, close }] = useDisclosure(false);

  const positions = api.election.getElectionVoting.useQuery(election.id, {
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false,
  });

  const voteMutation = api.election.vote.useMutation({
    onSuccess: async () => {
      notifications.show({
        title: "Vote casted successfully!",
        message: "You can now view the realtime results",
        icon: <IconCheck size="1.1rem" />,
        autoClose: 5000,
      });
      await router.push(`/${election.slug}/realtime`);
      await fireConfetti();
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
  });
  if (positions.isLoading) return <Text>Loading...</Text>;

  if (positions.isError) return <Text>Error:{positions.error.message}</Text>;

  if (!positions.data) return <Text>Not found</Text>;

  return (
    <>
      <Modal
        opened={opened || voteMutation.isLoading}
        onClose={close}
        title="Confirm Vote"
      >
        {positions.data.map((position) => {
          const candidate = position.candidate.find(
            (candidate) =>
              candidate.id ===
              votes
                .find((vote) => vote.split("-")[0] === position.id)
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
                      candidate.middle_name
                        ? " " + candidate.middle_name.charAt(0) + "."
                        : ""
                    } (${candidate.partylist.acronym})`
                  : "Abstain"}
              </Text>
            </Box>
          );
        })}
        {voteMutation.isError &&
          voteMutation.error?.data?.code !== "CONFLICT" && (
            <Alert
              icon={<IconAlertCircle size="1rem" />}
              title="Error"
              color="red"
            >
              {voteMutation.error?.message}
            </Alert>
          )}
        <Group position="right" spacing="xs">
          <Button
            variant="default"
            onClick={close}
            disabled={voteMutation.isLoading}
          >
            Cancel
          </Button>
          <Button
            loading={voteMutation.isLoading}
            onClick={() => {
              voteMutation.mutate({
                electionId: election.id,
                votes,
              });
            }}
          >
            Confirm
          </Button>
        </Group>
      </Modal>
      <Container>
        <Text size="lg" weight="bold">
          Cast your vote for {election.name}
        </Text>
        <Text>
          Select your candidates for each position. You can only select one
        </Text>
        <Stack>
          {positions.data.map((position) => {
            return (
              <Box key={position.id}>
                <Text size="xl">{position.name}</Text>
                <Radio.Group
                  name={position.id}
                  onChange={(value) => {
                    setVotes((prev) => {
                      return prev
                        .filter((prev) => prev.split("-")[0] !== position.id)
                        .concat(value);
                    });
                  }}
                >
                  {position.candidate.map((candidate) => {
                    return (
                      <Radio
                        key={candidate.id}
                        value={position.id + "-" + candidate.id}
                        label={`${candidate.last_name}, ${
                          candidate.first_name
                        }${
                          candidate.middle_name
                            ? " " + candidate.middle_name.charAt(0) + "."
                            : ""
                        } (${candidate.partylist.acronym})`}
                      />
                    );
                  })}
                  <Radio value={`${position.id}-abstain`} label="Abstain" />
                </Radio.Group>
              </Box>
            );
          })}
        </Stack>

        <Center>
          <Button
            disabled={positions.data.length !== votes.length}
            onClick={open}
            leftIcon={<IconFingerprint />}
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
