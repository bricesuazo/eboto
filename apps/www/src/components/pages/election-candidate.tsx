"use client";

import Image from "next/image";
import Link from "next/link";
import { api } from "@/trpc/client";
import { Adsense } from "@ctrl/react-adsense";
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

import type { RouterOutputs } from "@eboto/api";
import { formatName } from "@eboto/constants";

import AdModal from "../ad-modal";
import MessageCommissioner from "../modals/message-commissioner";
import MyMessagesElection from "../my-messages-election";

export default function ElectionCandidate({
  data,
  candidate_slug,
  election_slug,
  is_free,
}: {
  data: RouterOutputs["candidate"]["getPageData"];
  candidate_slug: string;
  election_slug: string;
  is_free: boolean;
}) {
  const {
    data: { candidate, election, isVoterCanMessage },
  } = api.candidate.getPageData.useQuery(
    {
      candidate_slug: candidate_slug,
      election_slug: election_slug,
    },
    { initialData: data },
  );

  return (
    <>
      {is_free && <AdModal />}
      {!is_free && isVoterCanMessage && (
        <MyMessagesElection election_id={election.id} />
      )}

      <Container py="xl" size="md" mb={80}>
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
              {formatName(election.name_arrangement, candidate)}
            </Text>
          </Breadcrumbs>
          <Flex gap="md" direction={{ base: "column", xs: "row" }}>
            <Box pos={{ base: "initial", xs: "sticky" }} top={76} h="100%">
              <Box
                pos="relative"
                w={{ base: "100%", xs: 200, sm: 280 }}
                style={{ aspectRatio: "1/1" }}
              >
                {candidate.image_url ? (
                  <Image
                    src={candidate.image_url}
                    alt={formatName(election.name_arrangement, candidate, true)}
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
                {formatName(election.name_arrangement, candidate)}
              </Title>
              <Text>Running for {candidate.position.name}</Text>
              <Text>{candidate.partylist.name}</Text>
              {!is_free && isVoterCanMessage && (
                <MessageCommissioner election_id={election.id} />
              )}

              {is_free && (
                <Adsense
                  style={{
                    display: "block",
                    width: "100%",
                  }}
                  client="ca-pub-5390007673890590"
                  slot="6949415137"
                  format="auto"
                  responsive="true"
                />
              )}

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
                        {candidate.credential.achievements.length > 1
                          ? "s"
                          : ""}
                      </Title>
                      <List withPadding listStyleType="none">
                        {candidate.credential.achievements.map(
                          (achievement) => (
                            <ListItem key={achievement.id}>
                              {achievement.name} - (
                              {moment(achievement.year).format("YYYY")})
                            </ListItem>
                          ),
                        )}
                      </List>
                    </Box>
                  ) : null}

                  {candidate.credential.affiliations.length ? (
                    <Box>
                      <Title order={5}>
                        Affiliation
                        {candidate.credential.affiliations.length > 1
                          ? "s"
                          : ""}
                      </Title>
                      <List withPadding listStyleType="none">
                        {candidate.credential.affiliations.map(
                          (affiliation) => (
                            <ListItem key={affiliation.id}>
                              {affiliation.org_name} -{" "}
                              {affiliation.org_position} (
                              {moment(affiliation.start_year).format("YYYY")}-
                              {moment(affiliation.end_year).format("YYYY")})
                            </ListItem>
                          ),
                        )}
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
    </>
  );
}
