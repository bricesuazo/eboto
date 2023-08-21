import ScrollToTopButton from "@/components/client/components/scroll-to-top";
import ElectionShowQRCode from "@/components/client/modals/election-show-qr-code";
import { isElectionOngoing } from "@/utils";
import { db } from "@eboto-mo/db";
import {
  Box,
  Button,
  Container,
  Flex,
  Spoiler,
  Stack,
  Text,
  Title,
  UnstyledButton,
} from "@mantine/core";
import { IconClock, IconFingerprint, IconUser } from "@tabler/icons-react";
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
  });

  return (
    <>
      <ScrollToTopButton />

      <Container py="xl" size="md">
        {positions.length === 0 ? (
          <Text>
            This election has no positions. Please contact the election
            commissioner for more information.
          </Text>
        ) : (
          <>
            <Stack align="center">
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

                <Title order={2} ta="center" maw={600}>
                  {election.name} (@{election.slug})
                </Title>

                <Text ta="center">
                  {moment(election.start_date)
                    .local()
                    .format("MMMM DD, YYYY hA (dddd)")}
                  {" - "}
                  {moment(election.end_date)
                    .local()
                    .format("MMMM DD, YYYY hA (dddd)")}
                </Text>
                <Text ta="center">
                  Publicity:{" "}
                  {(() => {
                    switch (election.publicity) {
                      case "PRIVATE":
                        return "Private (Only commissioners can see this election)";
                      case "VOTER":
                        return "Voter (Only voters and commissioners can see this election)";
                      case "PUBLIC":
                        return "Public (Everyone can see this election)";
                      default:
                        return null;
                    }
                  })()}
                </Text>

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

              <Stack gap="lg" w="100%">
                {positions.map((position) => (
                  <Stack gap={4} key={position.id}>
                    <Title
                      order={3}
                      tw="bold"
                      ta="center"
                      style={{ lineClamp: 2 }}
                    >
                      <Balancer>{position.name}</Balancer>
                    </Title>

                    <Flex gap="sm" mih="12rem">
                      {position.candidates.length === 0 ? (
                        <Text ta="center">No candidates</Text>
                      ) : (
                        position.candidates.map((candidate) => (
                          <UnstyledButton
                            component={Link}
                            href={`/${election?.slug || ""}/${candidate.slug}`}
                            style={{
                              backgroundColor: "red",
                            }}
                            // style={(theme) => ({
                            //   display: "flex",
                            //   flexDirection: "column",
                            //   alignItems: "center",
                            //   width: 200,
                            //   height: 192,
                            //   padding: theme.spacing.xs,
                            //   borderRadius: theme.radius.md,
                            //   transition: "background-color 0.2s ease",
                            //   // backgroundColor:
                            //   //   theme.colorScheme === "dark"
                            //   //     ? theme.colors.dark[6]
                            //   //     : theme.colors.gray[0],
                            //   // "&:hover": {
                            //   //   backgroundColor:
                            //   //     theme.colorScheme === "dark"
                            //   //       ? theme.colors.dark[5]
                            //   //       : theme.colors.gray[1],
                            //   // },

                            //   // [theme.fn.smallerThan("xs")]: {
                            //   //   width: "100%",
                            //   //   flexDirection: "row",
                            //   //   justifyContent: "flex-start",
                            //   //   columnGap: theme.spacing.xs,
                            //   //   height: 128,
                            //   // },
                            // })}
                            key={candidate.id}
                          >
                            <Box>
                              {candidate.image_link ? (
                                <Image
                                  src={candidate.image_link}
                                  alt="Candidate's image"
                                  width={92}
                                  height={92}
                                  style={{
                                    objectFit: "cover",
                                  }}
                                  priority
                                />
                              ) : (
                                <IconUser
                                  style={{ width: 92, height: 92, padding: 8 }}
                                />
                              )}
                            </Box>

                            <Text lineClamp={2} ta="center" hiddenFrom="sm">
                              {candidate.first_name}{" "}
                              {candidate.middle_name
                                ? candidate.middle_name + " "
                                : ""}
                              {candidate.last_name} (
                              {candidate.partylist.acronym})
                            </Text>
                            <Text lineClamp={2} ta="left" visibleFrom="sm">
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
                    </Flex>
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
