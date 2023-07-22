'use client';

import CreateCandidate from '@/components/client/modals/create-candidate';
import DeleteCandidate from '@/components/client/modals/delete-candidate';
import EditCandidate from '@/components/client/modals/edit-candidate';
import {
  type Candidate,
  type Election,
  type Partylist,
  type Position,
} from '@eboto-mo/db/schema';
import { Anchor, Box, Flex, Group, Stack, Text } from '@mantine/core';
import { IconUser } from '@tabler/icons-react';
import Image from 'next/image';
import Link from 'next/link';
import Balancer from 'react-wrap-balancer';

export default function DashboardCandidate({
  positionsWithCandidates,
  election,
  partylists,
  positions,
}: {
  positionsWithCandidates: (Position & {
    candidates: (Candidate & {
      credential: {
        id: string;
        affiliations: {
          id: string;
          org_name: string;
          org_position: string;
          start_year: Date;
          end_year: Date;
        }[];
        achievements: {
          id: string;
          name: string;
          year: Date;
        }[];
        events_attended: {
          id: string;
          name: string;
          year: Date;
        }[];
      } | null;
      platforms: {
        id: string;
        title: string;
        description: string;
      }[];
    })[];
  })[];
  election: Election;
  partylists: Partylist[];
  positions: Position[];
}) {
  return (
    <Stack spacing="lg">
      {positionsWithCandidates.length === 0 ? (
        <Box>
          <Text>
            No positions yet. Please add{' '}
            <Anchor
              component={Link}
              href={`/dashboard/${election.slug}/position`}
            >
              positions
            </Anchor>{' '}
            first.
          </Text>
        </Box>
      ) : (
        positionsWithCandidates.map((position) => {
          return (
            <Candidates
              key={position.id}
              position={position}
              partylists={partylists}
              positions={positions}
            />
          );
        })
      )}
    </Stack>
  );
}

function Candidates({
  position,
  partylists,
  positions,
}: {
  position: Position & {
    candidates: (Candidate & {
      credential: {
        id: string;
        affiliations: {
          id: string;
          org_name: string;
          org_position: string;
          start_year: Date;
          end_year: Date;
        }[];
        achievements: {
          id: string;
          name: string;
          year: Date;
        }[];
        events_attended: {
          id: string;
          name: string;
          year: Date;
        }[];
      } | null;
      platforms: {
        id: string;
        title: string;
        description: string;
      }[];
    })[];
  };
  partylists: Partylist[];
  positions: Position[];
}) {
  return (
    <Box>
      <Text
        weight="bold"
        size="xl"
        w="100%"
        sx={(theme) => ({
          [theme.fn.smallerThan('xs')]: {
            textAlign: 'center',
          },
        })}
      >
        <Balancer>{position.name}</Balancer>
      </Text>

      <Flex gap={12}>
        <Box>
          <CreateCandidate
            position={position}
            partylists={partylists}
            positions={positions}
          />
        </Box>

        <Flex
          gap="xs"
          sx={{
            overflow: 'auto',
          }}
          align="center"
        >
          {!position.candidates.length ? (
            <Text lineClamp={4}>
              <Balancer>No candidate in {position.name} yet...</Balancer>
            </Text>
          ) : (
            position.candidates.map((candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                partylists={partylists}
                positions={positions}
              />
            ))
          )}
        </Flex>
      </Flex>
    </Box>
  );
}

const CandidateCard = ({
  candidate,
  positions,
  partylists,
}: {
  candidate: Candidate & {
    credential: {
      id: string;
      affiliations: {
        id: string;
        org_name: string;
        org_position: string;
        start_year: Date;
        end_year: Date;
      }[];
      achievements: {
        id: string;
        name: string;
        year: Date;
      }[];
      events_attended: {
        id: string;
        name: string;
        year: Date;
      }[];
    } | null;
    platforms: {
      id: string;
      title: string;
      description: string;
    }[];
  };
  positions: Position[];
  partylists: Partylist[];
}) => {
  return (
    <Box>
      <Flex
        direction="column"
        h={140}
        p={8}
        align="center"
        justify="space-between"
        sx={(theme) => ({
          width: 200,
          border: '1px solid',
          borderColor:
            theme.colorScheme === 'dark'
              ? theme.colors.dark[5]
              : theme.colors.gray[3],
          borderRadius: 8,

          [theme.fn.smallerThan('xs')]: {
            width: 140,
          },
        })}
      >
        <Flex direction="column" align="center">
          {candidate.image_link ? (
            <Image
              src={candidate.image_link}
              width={52}
              height={52}
              alt={candidate.first_name + ' ' + candidate.last_name + ' image'}
              priority
              style={{ objectFit: 'cover' }}
            />
          ) : (
            <IconUser
              size={52}
              style={{
                padding: 8,
              }}
            />
          )}
          <Text align="center" w="full" lineClamp={1}>
            {candidate.first_name}
            {candidate.middle_name && ` ${candidate.middle_name}`}{' '}
            {candidate.last_name}
          </Text>
        </Flex>

        <Group spacing="xs">
          <EditCandidate
            positions={positions}
            candidate={candidate}
            partylists={partylists}
          />
          <DeleteCandidate candidate={candidate} />
        </Group>
      </Flex>
    </Box>
  );
};
