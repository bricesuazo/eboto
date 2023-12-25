"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ScrollToTopButton from "@/components/client/components/scroll-to-top";
import ElectionShowQRCode from "@/components/client/modals/election-show-qr-code";
import classes from "@/styles/Election.module.css";
import { api } from "@/trpc/client";
import {
  ActionIcon,
  Anchor,
  Box,
  Button,
  Center,
  Container,
  Flex,
  Group,
  HoverCard,
  HoverCardDropdown,
  HoverCardTarget,
  Modal,
  Stack,
  Text,
  TextInput,
  Title,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import {
  IconClock,
  IconFingerprint,
  IconInfoCircle,
  IconUser,
} from "@tabler/icons-react";
import moment from "moment";
import Balancer from "react-wrap-balancer";

import type { RouterOutputs } from "@eboto/api";
import { isElectionEnded, parseHourTo12HourFormat } from "@eboto/constants";

import MyMessagesElection from "../components/my-messages-election";
import MessageCommissioner from "../modals/message-commissioner";

export default function ElectionPage({
  data,
  election_slug,
}: {
  data: RouterOutputs["election"]["getElectionPage"];
  election_slug: string;
}) {
  const router = useRouter();
  const [opened, { open, close }] = useDisclosure(false);
  const [spoilerOpened, { open: setSpoilerOpen, close: setSpoilerClose }] =
    useDisclosure(false);

  const addVoterFieldToVoterMutation =
    api.voter.addVoterFieldToVoter.useMutation({
      onSuccess: () => {
        router.push(`/${election_slug}/vote`);
        close();
      },
    });
  const {
    data: {
      election,
      positions,
      hasVoted,
      myVoterData,
      isOngoing,
      isVoterCanMessage,
    },
  } = api.election.getElectionPage.useQuery(
    {
      election_slug,
    },
    {
      initialData: data,
    },
  );

  const form = useForm<Record<string, string>>({
    initialValues: Object.fromEntries(
      election.voter_fields.map((field) => [field.id, ""]),
    ),
    validate: (values) => {
      const errors: Record<string, string> = {};
      election.voter_fields.forEach((field) => {
        if (!values[field.id]) {
          errors[field.id] = `${field.name} is required`;
        }
      });
      return errors;
    },
  });
  useEffect(() => {
    if (opened) {
      form.reset();
      addVoterFieldToVoterMutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);
  return (
    <>
      {/* <AdModal /> */}
      <ScrollToTopButton />
      {isVoterCanMessage && <MyMessagesElection election_id={election.id} />}
      <Modal
        opened={opened || addVoterFieldToVoterMutation.isPending}
        onClose={close}
        title="Fill up this form first before voting."
        closeOnClickOutside={false}
        centered
      >
        <form
          onSubmit={form.onSubmit((value) =>
            addVoterFieldToVoterMutation.mutate({
              election_id: election.id,
              voter_id: myVoterData?.id ?? "",
              fields: Object.entries(value).map(([key, value]) => ({
                id: key,
                value,
              })),
            }),
          )}
        >
          <Stack gap="sm">
            {Object.entries(form.values).map(([key]) => {
              const field = election.voter_fields.find(
                (field) => field.id === key,
              );
              if (!field) return null;
              return (
                <TextInput
                  key={key}
                  required
                  label={field.name}
                  placeholder={field.name}
                  {...form.getInputProps(key)}
                />
              );
            })}
            <Group justify="right" gap="xs">
              <Button
                variant="default"
                onClick={close}
                disabled={addVoterFieldToVoterMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!form.isValid()}
                loading={addVoterFieldToVoterMutation.isPending}
              >
                Vote now!
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <Container pt={40} pb={80} size="md">
        <Stack align="center" gap="xl">
          <Box>
            <Flex justify="center" mb={8}>
              {election.logo ? (
                <Image
                  src={election.logo.url}
                  alt="Logo"
                  width={128}
                  height={128}
                  priority
                  sizes="100%"
                  style={{ objectFit: "cover" }}
                />
              ) : (
                <IconFingerprint size={128} style={{ padding: 8 }} />
              )}
            </Flex>
            <Title order={1} ta="center" maw={600} mb={4}>
              <Balancer>
                {election.name} (@{election.slug})
              </Balancer>
            </Title>
            <Text ta="center">
              <Balancer>
                {moment(election.start_date).local().format("MMMM DD, YYYY")}
                {" - "}
                {moment(election.end_date).local().format("MMMM DD, YYYY")}
              </Balancer>
            </Text>
            <Text ta="center">
              Voting hours:{" "}
              {election.voting_hour_start === 0 &&
              election.voting_hour_end === 24
                ? "Whole day"
                : parseHourTo12HourFormat(election.voting_hour_start) +
                  " - " +
                  parseHourTo12HourFormat(election.voting_hour_end)}
            </Text>
            <Flex align="center" justify="center" gap="xs">
              <Text ta="center">
                Publicity:{" "}
                {election.publicity.charAt(0) +
                  election.publicity.slice(1).toLowerCase()}{" "}
              </Text>
              <HoverCard width={180} shadow="md" openDelay={500}>
                <HoverCardTarget>
                  <ActionIcon
                    size="xs"
                    color="gray"
                    variant="subtle"
                    radius="xl"
                    aria-label="Publicity information"
                  >
                    <IconInfoCircle />
                  </ActionIcon>
                </HoverCardTarget>
                <HoverCardDropdown>
                  <Text size="sm">
                    <Balancer>
                      {(() => {
                        switch (election.publicity) {
                          case "PRIVATE":
                            return "Only commissioners can see this election";
                          case "VOTER":
                            return "Only voters and commissioners can see this election";
                          case "PUBLIC":
                            return "Everyone can see this election";
                          default:
                            return null;
                        }
                      })()}
                    </Balancer>
                  </Text>
                </HoverCardDropdown>
              </HoverCard>
            </Flex>
            {election.description && (
              <Box maw="40rem" mt="sm" ta="center">
                <Text>About this election:</Text>
                <Text lineClamp={spoilerOpened ? undefined : 3}>
                  {election.description}
                </Text>
                {election.description.length > 200 && (
                  <Anchor
                    onClick={spoilerOpened ? setSpoilerClose : setSpoilerOpen}
                  >
                    {spoilerOpened ? "Show less" : "Show more"}
                  </Anchor>
                )}
              </Box>
            )}
            <Flex justify="center" gap="sm" mt={8} align="center">
              {election.publicity === "PUBLIC" ||
              hasVoted ||
              isElectionEnded({ election }) ? (
                <Button
                  radius="xl"
                  size="md"
                  component={Link}
                  leftSection={<IconClock />}
                  href={`/${election.slug}/realtime`}
                >
                  Realtime count
                </Button>
              ) : !isOngoing ? (
                <Text c="red">Voting is not yet open</Text>
              ) : (
                !!myVoterData && (
                  <>
                    {!!election.voter_fields.length && !myVoterData.field ? (
                      <Button
                        onClick={open}
                        radius="xl"
                        size="md"
                        leftSection={<IconFingerprint />}
                      >
                        Vote now!
                      </Button>
                    ) : (
                      <Button
                        radius="xl"
                        size="md"
                        leftSection={<IconFingerprint />}
                        component={Link}
                        href={`/${election.slug}/vote`}
                      >
                        Vote now!
                      </Button>
                    )}
                  </>
                )
              )}
              <ElectionShowQRCode election={election} />
            </Flex>
            {isVoterCanMessage && (
              <Center mt="xs">
                <MessageCommissioner election_id={election.id} />
              </Center>
            )}
          </Box>
          {/* <Adsense
            style={{
              display: "block",
              width: "100%",
            }}
            client="ca-pub-8443325162715161"
            slot="6949415137"
            format="auto"
            responsive="true"
          /> */}

          <Stack gap="xl" w="100%">
            {positions.length === 0 ? (
              <Text ta="center">
                <Balancer>
                  This election has no positions. Please contact the election
                  commissioner for more information.
                </Balancer>
              </Text>
            ) : (
              positions.map((position) => (
                <Stack gap="xs" key={position.id}>
                  <Flex wrap="wrap" align="center" justify="center" gap="xs">
                    <Title
                      order={2}
                      tw="bold"
                      ta="center"
                      style={{ lineClamp: 2, wordBreak: "break-word" }}
                    >
                      <Balancer>{position.name}</Balancer>
                    </Title>
                    <Tooltip
                      multiline
                      withArrow
                      label={
                        position.min === 0 && position.max === 1
                          ? `Voters can only vote 1 candidate for ${position.name}`
                          : `Voters can vote minimum of ${position.min} and maximum of ${position.max} candidates for ${position.name}`
                      }
                      maw={240}
                    >
                      <ActionIcon
                        size="xs"
                        color="gray"
                        variant="subtle"
                        radius="xl"
                      >
                        <IconInfoCircle />
                      </ActionIcon>
                    </Tooltip>
                  </Flex>

                  <Group justify="center" gap="sm">
                    {!position.candidates.length ? (
                      <Text fz="lg" ta="center">
                        <Balancer>
                          No candidates for {position.name} yet.
                        </Balancer>
                      </Text>
                    ) : (
                      position.candidates.map((candidate) => (
                        <UnstyledButton
                          key={candidate.id}
                          component={Link}
                          href={`/${election.slug}/${candidate.slug}`}
                          className={classes["candidate-card"]}
                        >
                          <Center
                            pos="relative"
                            style={{
                              aspectRatio: 1,
                              flex: 1,
                              // width: "100%",
                            }}
                          >
                            {candidate.image ? (
                              <Image
                                src={candidate.image.url}
                                alt="Candidate's image"
                                fill
                                sizes="100%"
                                style={{ objectFit: "cover" }}
                                priority
                              />
                            ) : (
                              <IconUser size={92} width="100%" />
                            )}
                          </Center>

                          <Text lineClamp={2} ta="center">
                            {candidate.first_name}{" "}
                            {candidate.middle_name
                              ? candidate.middle_name + " "
                              : ""}
                            {candidate.last_name} ({candidate.partylist.acronym}
                            )
                          </Text>
                        </UnstyledButton>
                      ))
                    )}
                  </Group>
                </Stack>
              ))
            )}
          </Stack>
        </Stack>
      </Container>
    </>
  );
}
