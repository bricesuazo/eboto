import {
  Box,
  Button,
  Container,
  Stack,
  Text,
  Modal,
  Group,
  Alert,
  Title,
  Center,
  Loader,
  Radio,
  Checkbox,
} from "@mantine/core";
import { useDidUpdate, useDisclosure } from "@mantine/hooks";
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
import { useConfetti } from "../../lib/confetti";
import { getServerAuthSession } from "../../server/auth";
import { prisma } from "../../server/db";
import { api } from "../../utils/api";
import { isElectionOngoing } from "../../utils/isElectionOngoing";
import Balancer from "react-wrap-balancer";
import VoteCard from "../../VoteCard";
import Head from "next/head";
import toWords from "../../lib/toWords";
import { useForm } from "@mantine/form";

const VotePage = ({ election }: { election: Election }) => {
  const title = `${election.name} – Vote | eBoto Mo`;
  const router = useRouter();
  const { fireConfetti } = useConfetti();
  const [opened, { open, close }] = useDisclosure(false);

  const form = useForm<{
    [key: string]: {
      votes: string[];
      min: number;
      max: number;
      isValid: boolean;
    };
  }>();

  const positions = api.election.getElectionVoting.useQuery(election.id);

  const voteMutation = api.election.vote.useMutation({
    onSuccess: async () => {
      await router.push(`/${election.slug}/realtime`);
      notifications.show({
        title: "Vote casted successfully!",
        message: "You can now view the realtime results",
        icon: <IconCheck size="1.1rem" />,
        autoClose: 5000,
      });
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

  useDidUpdate(() => {
    if (positions.data) {
      form.setValues(
        positions.data.reduce(
          (acc, position) => {
            acc[position.id] = {
              votes: [],
              min: position.min,
              max: position.max,
              isValid: false,
            };
            return acc;
          },

          {} as typeof form.values
        )
      );
    }
  }, [positions.data]);

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>

      <Container py="xl">
        {positions.isLoading ? (
          <Center h="100%">
            <Loader size="lg" />
          </Center>
        ) : positions.isError ? (
          <Text>Error:{positions.error.message}</Text>
        ) : !positions.data ? (
          <Text>Not found</Text>
        ) : (
          <>
            <Modal
              opened={opened || voteMutation.isLoading}
              onClose={close}
              title={<Text weight={600}>Confirm Vote</Text>}
            >
              <form
                onSubmit={form.onSubmit((values) => {
                  voteMutation.mutate({
                    electionId: election.id,
                    votes: Object.entries(values).map(([key, value]) => ({
                      positionId: key,
                      votes: value.votes,
                    })),
                  });
                })}
              >
                <Stack>
                  {positions.data.map((position) => {
                    return (
                      <Box key={position.id}>
                        <Text lineClamp={1}>{position.name}</Text>
                        <Text lineClamp={1} size="xs" color="dimmed">
                          {position.min === 0 && position.max === 1
                            ? `One selection only (1)`
                            : `${
                                position.min
                                  ? `At least ${toWords
                                      .convert(position.min)
                                      .toLowerCase()} and a`
                                  : " A"
                              }t most ${toWords
                                .convert(position.max)
                                .toLowerCase()} (${position.min} - ${
                                position.max
                              })`}
                        </Text>
                        {Object.entries(form.values)
                          .find(([key]) => key === position.id)?.[1]
                          .votes.map((candidateId) => {
                            const candidate = position.candidate.find(
                              (candidate) => candidate.id === candidateId
                            );

                            return (
                              <Text
                                key={candidateId}
                                weight={600}
                                lineClamp={2}
                                color="gray.500"
                                size="lg"
                              >
                                {candidate
                                  ? `${candidate.last_name}, ${
                                      candidate.first_name
                                    }${
                                      candidate.middle_name
                                        ? " " +
                                          candidate.middle_name.charAt(0) +
                                          "."
                                        : ""
                                    } (${candidate.partylist.acronym})`
                                  : "Abstain"}
                              </Text>
                            );
                          })}
                      </Box>
                    );
                  })}

                  {voteMutation.isError && (
                    <Alert
                      icon={<IconAlertCircle size="1rem" />}
                      title="Error"
                      color="red"
                    >
                      {voteMutation.error.message}
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
                      // onClick={() => {
                      //   voteMutation.mutate({
                      //     electionId: election.id,
                      //     votes:
                      //   });
                      // }}
                      type="submit"
                    >
                      Confirm
                    </Button>
                  </Group>
                </Stack>
              </form>
            </Modal>
            <Stack
              sx={{
                position: "relative",
              }}
            >
              <Box>
                <Title align="center">
                  <Balancer>Cast your vote for {election.name}</Balancer>
                </Title>
                <Text align="center">
                  <Balancer>Select your candidates for each position.</Balancer>
                </Text>
              </Box>
              <form>
                <Stack>
                  {positions.data.map((position) => {
                    return (
                      <Box key={position.id}>
                        <Text size="xl">{position.name}</Text>
                        <Text size="sm" color="grayText">
                          {position.min === 0 && position.max === 1
                            ? "Select only one."
                            : `Select ${
                                position.min
                                  ? `at least ${toWords
                                      .convert(position.min)
                                      .toLowerCase()} and `
                                  : ""
                              }at most ${toWords
                                .convert(position.max)
                                .toLowerCase()}. (${
                                position.min ? `${position.min} - ` : ""
                              }${position.max})`}
                        </Text>

                        <Group>
                          {position.min === 0 && position.max === 1 ? (
                            <Radio.Group
                              onChange={(e) => {
                                form.setFieldValue(position.id, {
                                  votes: [e],
                                  min: position.min,
                                  max: position.max,
                                  isValid: true,
                                });
                              }}
                            >
                              <Group mt="xs">
                                {position.candidate.map((candidate) => (
                                  <VoteCard
                                    isSelected={
                                      form.values[position.id]?.votes.includes(
                                        candidate.id
                                      ) ?? false
                                    }
                                    candidate={candidate}
                                    type="radio"
                                    key={candidate.id}
                                    value={candidate.id}
                                  />
                                ))}
                                <VoteCard
                                  type="radio"
                                  isSelected={
                                    form.values[position.id]?.votes.includes(
                                      "abstain"
                                    ) ?? false
                                  }
                                  value="abstain"
                                />
                              </Group>
                            </Radio.Group>
                          ) : (
                            <Checkbox.Group
                              onChange={(e) => {
                                const votes = e.includes("abstain")
                                  ? form.values[position.id]?.votes.includes(
                                      "abstain"
                                    )
                                    ? e.filter((e) => e !== "abstain")
                                    : ["abstain"]
                                  : e;

                                form.setFieldValue(position.id, {
                                  votes,
                                  min: position.min,
                                  max: position.max,
                                  isValid:
                                    votes.length !== 0 &&
                                    ((votes.includes("abstain") &&
                                      votes.length === 1) ||
                                      (votes.length >= position.min &&
                                        votes.length <= position.max)),
                                });
                              }}
                              value={form.values[position.id]?.votes}
                            >
                              <Group mt="xs">
                                {position.candidate.map((candidate) => {
                                  return (
                                    <VoteCard
                                      type="checkbox"
                                      candidate={candidate}
                                      isSelected={
                                        form.values[
                                          position.id
                                        ]?.votes.includes(candidate.id) ?? false
                                      }
                                      value={candidate.id}
                                      disabled={
                                        (form.values[position.id]?.votes
                                          .length ?? 0) >= position.max &&
                                        !form.values[
                                          position.id
                                        ]?.votes.includes(candidate.id)
                                      }
                                      key={candidate.id}
                                    />
                                  );
                                })}
                                <VoteCard
                                  type="checkbox"
                                  isSelected={
                                    form.values[position.id]?.votes.includes(
                                      "abstain"
                                    ) ?? false
                                  }
                                  value="abstain"
                                />
                              </Group>
                            </Checkbox.Group>
                          )}
                        </Group>
                      </Box>
                    );
                  })}
                </Stack>

                <Center
                  sx={{
                    position: "sticky",
                    bottom: 100,
                    alignSelf: "center",
                    marginTop: 12,
                    marginBottom: 100,
                  }}
                >
                  <Button
                    onClick={open}
                    disabled={
                      voteMutation.isLoading ||
                      !Object.values(form.values).every(
                        (value) => value?.isValid
                      )
                    }
                    leftIcon={<IconFingerprint />}
                    size="lg"
                    radius="xl"
                  >
                    Cast Vote
                  </Button>
                </Center>
              </form>
            </Stack>
          </>
        )}
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

  if (!session)
    return {
      redirect: {
        destination: `/signin?callbackUrl=https://eboto-mo.com/${context.query.electionSlug}/vote`,
        permanent: false,
      },
    };

  const election = await prisma.election.findUnique({
    where: {
      slug: context.query.electionSlug,
    },
  });

  if (!election) return { notFound: true };

  if (!isElectionOngoing({ election, withTime: true }))
    return {
      redirect: {
        destination: `/${election.slug}`,
        permanent: false,
      },
    };

  if (election.publicity === "PRIVATE") {
    const commissioner = await prisma.commissioner.findFirst({
      where: {
        electionId: election.id,
        userId: session.user.id,
      },
    });

    if (!commissioner) return { notFound: true };

    const isVoter = await prisma.voter.findFirst({
      where: {
        userId: commissioner.userId ?? "",
        electionId: election.id,
      },
    });

    if (!isVoter)
      return {
        redirect: {
          destination: `/${election.slug}/realtime`,
          permanent: false,
        },
      };
  } else if (
    election.publicity === "VOTER" ||
    election.publicity === "PUBLIC"
  ) {
    const vote = await prisma.vote.findFirst({
      where: {
        voterId: session.user.id,
        electionId: election.id,
      },
    });

    const isCommissioner = await prisma.commissioner.findFirst({
      where: {
        electionId: election.id,
        userId: session.user.id,
      },
    });

    const isVoter = await prisma.voter.findFirst({
      where: {
        userId: session.user.id,
        electionId: election.id,
      },
    });

    if (vote || (isCommissioner && !isVoter) || !isVoter)
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
