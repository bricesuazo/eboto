import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
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
import { env } from "env.mjs";
import moment from "moment";

import { db } from "@eboto-mo/db";

export async function generateMetadata({
  params: { electionSlug, candidateSlug },
}: {
  params: { electionSlug: string; candidateSlug: string };
}): Promise<Metadata> {
  const election = await db.query.elections.findFirst({
    where: (election, { eq }) => eq(election.slug, electionSlug),
  });

  if (!election) notFound();

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
            env.NODE_ENV === "production"
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
  const election = await db.query.elections.findFirst({
    where: (election, { eq, and, isNull }) =>
      and(eq(election.slug, electionSlug), isNull(election.deleted_at)),
  });

  if (!election) notFound();

  const candidate = await db.query.candidates.findFirst({
    where: (candidate, { eq, and, isNull }) =>
      and(
        eq(candidate.election_id, election.id),
        eq(candidate.slug, candidateSlug),
        isNull(candidate.deleted_at),
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
            <Box
              pos="relative"
              w={{ base: "100%", xs: 200, sm: 280 }}
              style={{ aspectRatio: "1/1" }}
            >
              {candidate.image_link ? (
                <Image
                  src={candidate.image_link}
                  alt={candidate.first_name + " " + candidate.last_name}
                  fill
                  sizes="100%"
                  priority
                  style={{ objectFit: "cover" }}
                />
              ) : (
                <IconUser width="100%" height="100%" stroke={1.5} />
              )}
            </Box>
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
                    <ListItem key={platform.id}>
                      <Title order={4}>{platform.title}</Title>
                      <Text>{platform.description}</Text>
                    </ListItem>
                  ))}
                </List>
              </Stack>
            ) : null}

            {candidate.credential.affiliations.length ||
            candidate.credential.achievements.length ||
            candidate.credential.events_attended.length ? (
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
                          {achievement.name} - (
                          {moment(achievement.year).format("YYYY")})
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
            ) : (
              <Text mt="xl">
                No credentials found. If you are the candidate, please contact
                the election commissioner to add your credentials.
              </Text>
            )}
          </Box>
        </Flex>
      </Stack>
    </Container>
  );
}
