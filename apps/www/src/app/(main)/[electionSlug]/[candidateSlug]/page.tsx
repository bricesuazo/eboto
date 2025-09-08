'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Adsense } from '@ctrl/react-adsense';
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
} from '@mantine/core';
import { IconUser } from '@tabler/icons-react';
import moment from 'moment';

import { formatName } from '@eboto/constants';

import AdModal from '~/components/ad-modal';
import MessageCommissioner from '~/components/modals/message-commissioner';
import MyMessagesElection from '~/components/my-messages-election';
import { api } from '~/trpc/client';
import CandidatePageLoading from './loading';

export default function CandidatePage() {
  const { electionSlug, candidateSlug } = useParams<{
    electionSlug: string;
    candidateSlug: string;
  }>();

  const candidateDataQuery = api.candidate.getPageData.useQuery({
    candidate_slug: candidateSlug,
    election_slug: electionSlug,
  });

  if (!candidateDataQuery.data) return <CandidatePageLoading />;

  return (
    <>
      {candidateDataQuery.data.is_free && <AdModal />}
      {!candidateDataQuery.data.is_free &&
        candidateDataQuery.data.isVoterCanMessage && (
          <MyMessagesElection
            election_id={candidateDataQuery.data.election.id}
          />
        )}

      <Container py="xl" size="md" mb={80}>
        <Stack>
          <Breadcrumbs w="100%">
            <Anchor
              component={Link}
              href={{ pathname: `/${electionSlug}` }}
              truncate
              maw={300}
            >
              {candidateDataQuery.data.election.name}
            </Anchor>

            <Text truncate maw={300}>
              {formatName(
                candidateDataQuery.data.election.name_arrangement,
                candidateDataQuery.data.candidate,
              )}
            </Text>
          </Breadcrumbs>
          <Flex gap="md" direction={{ base: 'column', xs: 'row' }}>
            <Box pos={{ base: 'initial', xs: 'sticky' }} top={76} h="100%">
              <Box
                pos="relative"
                w={{ base: '100%', xs: 200, sm: 280 }}
                style={{ aspectRatio: '1/1' }}
              >
                {candidateDataQuery.data.candidate.image_url ? (
                  <Image
                    src={candidateDataQuery.data.candidate.image_url}
                    alt={formatName(
                      candidateDataQuery.data.election.name_arrangement,
                      candidateDataQuery.data.candidate,
                      true,
                    )}
                    fill
                    sizes="100%"
                    priority
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <IconUser width="100%" height="100%" stroke={1.5} />
                )}
              </Box>
            </Box>

            <Box style={{ flex: 1 }}>
              <Title order={2}>
                {formatName(
                  candidateDataQuery.data.election.name_arrangement,
                  candidateDataQuery.data.candidate,
                )}
              </Title>
              <Text>
                Running for {candidateDataQuery.data.candidate.position.name}
              </Text>
              <Text>{candidateDataQuery.data.candidate.partylist.name}</Text>
              {!candidateDataQuery.data.is_free &&
                candidateDataQuery.data.isVoterCanMessage && (
                  <MessageCommissioner
                    election_id={candidateDataQuery.data.election.id}
                  />
                )}

              {candidateDataQuery.data.is_free && (
                <Adsense
                  style={{
                    display: 'block',
                    width: '100%',
                  }}
                  client="ca-pub-8867310433048493"
                  slot="6949415137"
                  format="auto"
                  responsive="true"
                />
              )}

              {candidateDataQuery.data.candidate.platforms.length ? (
                <Stack mt="xl" gap="xs">
                  <Title order={3}>
                    Platform
                    {candidateDataQuery.data.candidate.platforms.length > 1
                      ? 's'
                      : ''}
                  </Title>
                  <List withPadding listStyleType="none">
                    {candidateDataQuery.data.candidate.platforms.map(
                      (platform) => (
                        <ListItem key={platform.id}>
                          <Title order={4}>{platform.title}</Title>
                          <Text>{platform.description}</Text>
                        </ListItem>
                      ),
                    )}
                  </List>
                </Stack>
              ) : null}

              {candidateDataQuery.data.candidate.credential.affiliations
                .length ||
              candidateDataQuery.data.candidate.credential.achievements
                .length ||
              candidateDataQuery.data.candidate.credential.events_attended
                .length ? (
                <Stack mt="xl" gap="xs">
                  <Title order={3}>Credentials</Title>

                  {candidateDataQuery.data.candidate.credential.achievements
                    .length ? (
                    <Box>
                      <Title order={5}>
                        Achievement
                        {candidateDataQuery.data.candidate.credential
                          .achievements.length > 1
                          ? 's'
                          : ''}
                      </Title>
                      <List withPadding listStyleType="none">
                        {candidateDataQuery.data.candidate.credential.achievements.map(
                          (achievement) => (
                            <ListItem key={achievement.id}>
                              {achievement.name} - (
                              {moment(achievement.year).format('YYYY')})
                            </ListItem>
                          ),
                        )}
                      </List>
                    </Box>
                  ) : null}

                  {candidateDataQuery.data.candidate.credential.affiliations
                    .length ? (
                    <Box>
                      <Title order={5}>
                        Affiliation
                        {candidateDataQuery.data.candidate.credential
                          .affiliations.length > 1
                          ? 's'
                          : ''}
                      </Title>
                      <List withPadding listStyleType="none">
                        {candidateDataQuery.data.candidate.credential.affiliations.map(
                          (affiliation) => (
                            <ListItem key={affiliation.id}>
                              {affiliation.org_name} -{' '}
                              {affiliation.org_position} (
                              {moment(affiliation.start_year).format('YYYY')}-
                              {moment(affiliation.end_year).format('YYYY')})
                            </ListItem>
                          ),
                        )}
                      </List>
                    </Box>
                  ) : null}

                  {candidateDataQuery.data.candidate.credential.events_attended
                    .length ? (
                    <Box>
                      <Title order={5}>
                        Seminar
                        {candidateDataQuery.data.candidate.credential
                          .events_attended.length > 1
                          ? 's'
                          : ''}
                        /Event
                        {candidateDataQuery.data.candidate.credential
                          .events_attended.length > 1
                          ? 's'
                          : ''}{' '}
                        Attended
                      </Title>

                      <List withPadding listStyleType="none">
                        {candidateDataQuery.data.candidate.credential.events_attended.map(
                          (event_attended) => (
                            <ListItem key={event_attended.id}>
                              {event_attended.name} (
                              {moment(event_attended.year).format('YYYY')})
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
