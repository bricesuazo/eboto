import ScrollToTopButton from "@/components/client/components/scroll-to-top";
import ElectionShowQRCode from "@/components/client/modals/election-show-qr-code";
import classes from "@/styles/Election.module.css";
import { isElectionOngoing } from "@/utils";
import { db } from "@eboto-mo/db";
import {
  ActionIcon,
  Box,
  Button,
  Container,
  Flex,
  Group,
  HoverCard,
  HoverCardDropdown,
  HoverCardTarget,
  Spoiler,
  Stack,
  Text,
  Title,
  UnstyledButton,
} from "@mantine/core";
import {
  IconClock,
  IconFingerprint,
  IconInfoCircle,
  IconUser,
} from "@tabler/icons-react";
import moment from "moment";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Balancer from "react-wrap-balancer";

export async function generateMetadata({
  params: { electionSlug },
}: {
  params: { electionSlug: string };
}): Promise<Metadata> {
  const election = await db.query.elections.findFirst({
    where: (election, { eq }) => eq(election.slug, electionSlug),
  });

  if (!election) return notFound();

  return {
    title: election.name,
    description: `See details about ${election.name} | eBoto Mo`,
    openGraph: {
      title: election.name,
      description: `See details about ${election.name} | eBoto Mo`,
      images: [
        {
          url: `${
            process.env.NODE_ENV === "production"
              ? "https://eboto-mo.com"
              : "http://localhost:3000"
          }/api/og?type=election&election_name=${encodeURIComponent(
            election.name,
          )}&election_logo=${encodeURIComponent(
            election.logo ?? "",
          )}&election_date=${encodeURIComponent(
            moment(election.start_date).format("MMMM D, YYYY hA") +
              " - " +
              moment(election.end_date).format("MMMM D, YYYY hA"),
          )}`,
          width: 1200,
          height: 630,
          alt: election.name,
        },
      ],
    },
  };
}

export default async function ElectionPage({
  params: { electionSlug },
}: {
  params: { electionSlug: string };
}) {
  const election = await db.query.elections.findFirst({
    where: (election, { eq }) => eq(election.slug, electionSlug),
  });

  if (!election) return notFound();

  const isOngoing = isElectionOngoing({ election });

  // const session = await currentUser();
  // TODO: Add authorization here.
  // https://github.com/bricesuazo/eboto-mo/blob/main/src/pages/%5BelectionSlug%5D/index.tsx

  const positions = await db.query.positions.findMany({
    where: (position, { eq }) => eq(position.election_id, election.id),
    with: {
      candidates: {
        with: {
          partylist: true,
        },
      },
    },
    orderBy: (positions, { asc }) => [asc(positions.order)],
  });

  return (
    <>
      <ScrollToTopButton />

      <Container pt={40} pb={80} size="md">
        {positions.length === 0 ? (
          <Text ta="center">
            This election has no positions. Please contact the election
            commissioner for more information.
          </Text>
        ) : (
          <>
            <Stack align="center" gap="xl">
              <Box>
                <Flex justify="center" mb={8}>
                  {election.logo ? (
                    <Image
                      src={election.logo}
                      alt="Logo"
                      width={92}
                      height={92}
                      priority
                    />
                  ) : (
                    <IconFingerprint size={92} style={{ padding: 8 }} />
                  )}
                </Flex>

                <Title order={1} ta="center" maw={600} mb={4}>
                  <Balancer>
                    {election.name} (@{election.slug})
                  </Balancer>
                </Title>

                <Text ta="center">
                  <Balancer>
                    {moment(election.start_date)
                      .local()
                      .format("MMMM DD, YYYY hA (ddd)")}
                    {" - "}
                    {moment(election.end_date)
                      .local()
                      .format("MMMM DD, YYYY hA (ddd)")}
                  </Balancer>
                </Text>

                <Flex align="center" justify="center" gap="xs">
                  <Text ta="center">
                    Publicity:{" "}
                    {election.publicity.charAt(0) +
                      election.publicity.slice(1).toLowerCase()}{" "}
                  </Text>
                  <HoverCard width={180} shadow="md">
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
                    <Spoiler
                      maxHeight={50}
                      showLabel="Show more"
                      hideLabel="Hide"
                    >
                      {election.description}
                    </Spoiler>
                  </Box>
                )}

                <Flex justify="center" gap="sm" mt={8}>
                  {
                    // hasVoted ||
                    election.end_date < new Date() ? (
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
                      <Button
                        radius="xl"
                        size="md"
                        leftSection={<IconFingerprint />}
                        component={Link}
                        href={`/${election.slug}/vote`}
                      >
                        Vote now!
                      </Button>
                    )
                  }
                  <ElectionShowQRCode election={election} />
                </Flex>
              </Box>

              <Stack gap="xl" w="100%">
                {positions.map((position) => (
                  <Stack gap="xs" key={position.id}>
                    <Title
                      order={2}
                      tw="bold"
                      ta="center"
                      style={{ lineClamp: 2, wordBreak: "break-word" }}
                    >
                      <Balancer>{position.name}</Balancer>
                    </Title>

                    <Group justify="center" gap="sm">
                      {!position.candidates.length ? (
                        <Text fz="lg" ta="center">
                          <Balancer>
                            No candidates for this position yet.
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
                            <Box>
                              {candidate.image_link ? (
                                <Box
                                  pos="relative"
                                  style={{ aspectRatio: 1 / 1 }}
                                >
                                  <Image
                                    src={candidate.image_link}
                                    alt="Candidate's image"
                                    fill
                                    style={{
                                      objectFit: "cover",
                                    }}
                                    priority
                                  />
                                </Box>
                              ) : (
                                <IconUser
                                  style={{ width: 92, height: 92, padding: 8 }}
                                />
                              )}
                            </Box>

                            <Text lineClamp={2} ta="center">
                              {candidate.first_name}{" "}
                              {candidate.middle_name
                                ? candidate.middle_name + " "
                                : ""}
                              {candidate.last_name} (
                              {candidate.partylist.acronym})
                            </Text>
                          </UnstyledButton>
                        ))
                      )}
                    </Group>
                  </Stack>
                ))}
              </Stack>
            </Stack>
          </>
        )}
      </Container>
    </>
  );
}
