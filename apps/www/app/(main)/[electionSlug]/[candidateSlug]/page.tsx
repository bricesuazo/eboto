import { auth } from "@clerk/nextjs";
import { db } from "@eboto-mo/db";
import {
  Anchor,
  Box,
  Breadcrumbs,
  Container,
  Flex,
  List,
  ListItem,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconUser } from "@tabler/icons-react";
import moment from "moment";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export async function generateMetadata({
  params: { electionSlug, candidateSlug },
}: {
  params: { electionSlug: string; candidateSlug: string };
}): Promise<Metadata> {
  const election = await db.query.elections.findFirst({
    where: (election, { eq }) => eq(election.slug, electionSlug),
  });

  if (!election) return notFound();

  if (election.publicity === "PRIVATE") return notFound();

  const candidate = await db.query.candidates.findFirst({
    where: (candidates, { eq, and }) =>
      and(
        eq(candidates.election_id, election.id),
        eq(candidates.slug, candidateSlug),
      ),
    with: {
      position: {
        columns: {
          name: true,
        },
      },
    },
  });

  if (!candidate) return notFound();

  return {
    title: `${`${candidate.last_name}, ${candidate.first_name}${
      candidate.middle_name ? " " + candidate.middle_name : ""
    }`} – ${election.name}`,
    description: `See information about ${candidate.first_name} ${candidate.last_name} | eBoto Mo`,
    openGraph: {
      title: election.name,
      description: `See information about ${candidate.first_name} ${candidate.last_name} | eBoto Mo`,
      images: [
        {
          url: `${
            process.env.NODE_ENV === "production"
              ? "https://eboto-mo.com"
              : "http://localhost:3000"
          }/api/og?type=candidate&candidate_name=${encodeURIComponent(
            candidate.first_name,
          )}${
            (candidate.middle_name &&
              `%20${encodeURIComponent(candidate.middle_name ?? "")}`) ??
            ""
          }%20${encodeURIComponent(
            candidate.last_name,
          )}&candidate_position=${encodeURIComponent(
            candidate.position.name,
          )}&candidate_img=${encodeURIComponent(candidate.image_link ?? "")}`,
          width: 1200,
          height: 630,
          alt: election.name,
        },
      ],
    },
  };
}

export default async function CandidatePage({
  params: { electionSlug, candidateSlug },
}: {
  params: { electionSlug: string; candidateSlug: string };
}) {
  const { userId } = auth();
  const election = await db.query.elections.findFirst({
    where: (elections, { eq }) => eq(elections.slug, electionSlug),
    // where: {
    //   candidates: {
    //     some: {
    //       slug: context.query.candidateSlug,
    //     },
    //   },
    // },
  });

  if (!election) notFound();

  if (election.publicity === "PRIVATE") {
    if (!userId) notFound();

    const commissioner = await db.query.commissioners.findFirst({
      where: (commissioners, { eq, and }) =>
        and(
          eq(commissioners.election_id, election.id),
          eq(commissioners.user_id, userId),
        ),
    });

    if (!commissioner) notFound();
  } else if (election.publicity === "VOTER") {
    const callbackUrl = `/sign-in?callbackUrl=https://eboto-mo.com/${electionSlug}/${candidateSlug}`;
    if (!userId) redirect(callbackUrl);

    const voter = await db.query.voters.findFirst({
      where: (voters, { eq, and }) =>
        and(eq(voters.election_id, election.id), eq(voters.user_id, userId)),
    });

    const commissioner = await db.query.commissioners.findFirst({
      where: (commissioners, { eq, and }) =>
        and(
          eq(commissioners.election_id, election.id),
          eq(commissioners.user_id, userId),
        ),
    });

    if (!voter && !commissioner) redirect(callbackUrl);
  }

  const candidate = await db.query.candidates.findFirst({
    where: (candidates, { eq, and }) =>
      and(
        eq(candidates.election_id, election.id),
        eq(candidates.slug, candidateSlug),
      ),
    with: {
      partylist: true,
      position: true,
      platforms: true,
      credential: {
        with: {
          achievements: true,
          affiliations: true,
          events_attended: true,
        },
      },
    },
  });

  if (!candidate) notFound();

  return (
    <Container py="xl" size="md">
      <Stack>
        <Breadcrumbs w="100%">
          <Anchor
            component={Link}
            href={`/${election.slug}`}
            truncate
            maw={300}
          >
            {election.name}
          </Anchor>

          <Text truncate maw={300}>
            {`${candidate.last_name}, ${candidate.first_name}${
              candidate.middle_name ? " " + candidate.middle_name : ""
            }`}
          </Text>
        </Breadcrumbs>
        <Flex gap="md" direction={{ base: "column", xs: "row" }}>
          <Box pos={{ base: "initial", xs: "sticky" }} top={76} h="100%">
            {candidate.image_link ? (
              <Box
                pos="relative"
                w={{ base: 280, sm: 200, xs: "100%" }}
                h={{ base: 280, sm: 200, xs: "auto" }}
                style={{ aspectRatio: "1/1" }}
              >
                <Image
                  src={candidate.image_link}
                  alt={candidate.first_name + " " + candidate.last_name}
                  fill
                  sizes="100%"
                  priority
                  style={{ objectFit: "cover" }}
                />
              </Box>
            ) : (
              <Box>
                <IconUser width="100%" height="100%" stroke={1.5} />
              </Box>
            )}
          </Box>

          <Box style={{ flex: 1 }}>
            <Title order={2}>
              {`${candidate.last_name}, ${candidate.first_name}${
                candidate.middle_name ? " " + candidate.middle_name : ""
              }`}
            </Title>
            <Text>Running for {candidate.position.name}</Text>
            <Text>{candidate.partylist.name}</Text>

            {candidate.platforms.length ? (
              <Stack mt="xl" gap="xs">
                <Title order={3}>
                  Platform{candidate.platforms.length > 1 ? "s" : ""}
                </Title>
                <List withPadding listStyleType="none">
                  {candidate.platforms.map((platform) => (
                    <List.Item key={platform.id}>
                      <Title order={4}>{platform.title}</Title>
                      <Text>{platform.description}</Text>
                    </List.Item>
                  ))}
                </List>
              </Stack>
            ) : null}

            {candidate.credential?.affiliations.length ??
            candidate.credential?.achievements.length ??
            candidate.credential?.events_attended.length ? (
              <Stack mt="xl" gap="xs">
                <Title order={3}>Credentials</Title>

                {candidate.credential.achievements.length ? (
                  <Box>
                    <Title order={5}>
                      Achievement
                      {candidate.credential.achievements.length > 1 ? "s" : ""}
                    </Title>
                    <List withPadding listStyleType="none">
                      {candidate.credential.achievements.map((achievement) => (
                        <ListItem key={achievement.id}>
                          ({moment(achievement.year).format("YYYY")})
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                ) : null}

                {candidate.credential.affiliations.length ? (
                  <Box>
                    <Title order={5}>
                      Affiliation
                      {candidate.credential.affiliations.length > 1 ? "s" : ""}
                    </Title>
                    <List withPadding listStyleType="none">
                      {candidate.credential.affiliations.map((affiliation) => (
                        <ListItem key={affiliation.id}>
                          {affiliation.org_name} - {affiliation.org_position} (
                          {moment(affiliation.start_year).format("YYYY")}-
                          {moment(affiliation.end_year).format("YYYY")})
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                ) : null}

                {candidate.credential.events_attended.length ? (
                  <Box>
                    <Title order={5}>
                      Seminar
                      {candidate.credential.events_attended.length > 1
                        ? "s"
                        : ""}
                      /Event
                      {candidate.credential.events_attended.length > 1
                        ? "s"
                        : ""}{" "}
                      Attended
                    </Title>

                    <List withPadding listStyleType="none">
                      {candidate.credential.events_attended.map(
                        (event_attended) => (
                          <ListItem key={event_attended.id}>
                            {event_attended.name} (
                            {moment(event_attended.year).format("YYYY")})
                          </ListItem>
                        ),
                      )}
                    </List>
                  </Box>
                ) : null}
              </Stack>
            ) : null}
          </Box>
        </Flex>
      </Stack>
    </Container>
  );
}
