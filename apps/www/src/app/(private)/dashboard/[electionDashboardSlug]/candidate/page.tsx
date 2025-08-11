'use client';

import { use, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Anchor,
  Box,
  Flex,
  Group,
  HoverCard,
  HoverCardDropdown,
  HoverCardTarget,
  ScrollArea,
  Select,
  Stack,
  Text,
} from '@mantine/core';
import { IconUser } from '@tabler/icons-react';
import Balancer from 'react-wrap-balancer';

import { formatName } from '@eboto/constants';

import CenterLoader from '~/components/center-loader';
import CreateCandidate from '~/components/modals/create-candidate';
import DeleteCandidate from '~/components/modals/delete-candidate';
import EditCandidate from '~/components/modals/edit-candidate';
import classes from '~/styles/Candidate.module.css';
import { api } from '~/trpc/client';

export default function Page({
  params,
}: {
  params: Promise<{ electionDashboardSlug: string }>;
}) {
  const router = useRouter();

  const { electionDashboardSlug } = use(params);
  const positionsWithCandidatesQuery = api.candidate.getDashboardData.useQuery({
    election_slug: electionDashboardSlug,
  });

  const getNameArrangementQuery = api.candidate.getNameArrangement.useQuery(
    {
      election_id: positionsWithCandidatesQuery.data?.election.id ?? '',
    },
    { enabled: !!positionsWithCandidatesQuery.data },
  );
  const [nameArangement, setNameArrangement] = useState(
    getNameArrangementQuery.data ?? 0,
  );

  const editNameArrangementMutation =
    api.candidate.editNameArrangement.useMutation({
      onSuccess: () => router.refresh(),
      onMutate: ({ name_arrangement }) => {
        setNameArrangement(name_arrangement);
      },
    });

  if (!positionsWithCandidatesQuery.data) return <CenterLoader />;

  return (
    <Stack gap="lg">
      <Select
        label="Candidate's name arrangement"
        placeholder="Pick name arrangement"
        disabled={editNameArrangementMutation.isPending}
        value={nameArangement.toString()}
        onChange={(e) => {
          if (!e) return;

          editNameArrangementMutation.mutate({
            election_id: positionsWithCandidatesQuery.data.election.id,
            name_arrangement: parseInt(e),
          });
        }}
        data={[
          { value: '0', label: 'First name Middle name Last name' },
          { value: '1', label: 'Last name, First name Middle name' },
        ]}
      />
      {positionsWithCandidatesQuery.data.positionsWithCandidates.length ===
      0 ? (
        <Box>
          <Text>
            No positions yet. Please add{' '}
            <Anchor
              component={Link}
              href={`/dashboard/${electionDashboardSlug}/position`}
            >
              positions
            </Anchor>{' '}
            first.
          </Text>
        </Box>
      ) : (
        positionsWithCandidatesQuery.data.positionsWithCandidates.map(
          (position) => (
            <Box key={position.id}>
              <Text
                fw="bold"
                size="xl"
                w="100%"
                ta={{ base: 'center', sm: 'left' }}
              >
                <Balancer>{position.name}</Balancer>
              </Text>

              <ScrollArea scrollbarSize={10} offsetScrollbars="x">
                <Flex gap="md">
                  <Box>
                    <CreateCandidate
                      election_slug={electionDashboardSlug}
                      position={position}
                    />
                  </Box>

                  <Flex
                    gap="xs"
                    style={{
                      overflow: 'auto',
                      flex: 1,
                    }}
                    align="center"
                  >
                    {!position.candidates.length ? (
                      <Box>
                        <Text lineClamp={4}>
                          <Balancer>
                            No candidate in {position.name} yet...
                          </Balancer>
                        </Text>
                      </Box>
                    ) : (
                      position.candidates.map((candidate) => {
                        const title = `${formatName(
                          positionsWithCandidatesQuery.data.election
                            .name_arrangement,
                          candidate,
                        )} (${candidate.partylist.acronym})`;
                        return (
                          <Group
                            key={candidate.id}
                            className={classes['candidate-card']}
                            // gap="xs"
                            px="md"
                          >
                            <HoverCard openDelay={500} width={256} offset={60}>
                              <HoverCardTarget>
                                <Stack align="center" justify="center" gap="xs">
                                  {candidate.image_url ? (
                                    <Image
                                      src={candidate.image_url}
                                      width={100}
                                      height={100}
                                      alt={
                                        candidate.first_name +
                                        ' ' +
                                        candidate.last_name +
                                        ' image'
                                      }
                                      priority
                                      style={{ objectFit: 'cover' }}
                                    />
                                  ) : (
                                    <IconUser
                                      size={100}
                                      style={{
                                        padding: 8,
                                      }}
                                    />
                                  )}
                                  <Text ta="center" w="full" lineClamp={1}>
                                    {title}
                                  </Text>
                                </Stack>
                              </HoverCardTarget>

                              <Flex gap="xs" align="center">
                                <EditCandidate
                                  candidate={{
                                    ...candidate,
                                    platforms: candidate.platforms.map(
                                      (platform) => ({
                                        ...platform,
                                        description:
                                          platform.description ?? undefined,
                                      }),
                                    ),
                                  }}
                                  election={
                                    positionsWithCandidatesQuery.data.election
                                  }
                                />
                                <DeleteCandidate
                                  candidate={candidate}
                                  name_arrangement={
                                    getNameArrangementQuery.data ?? 0
                                  }
                                />
                              </Flex>
                              <HoverCardDropdown>{title}</HoverCardDropdown>
                            </HoverCard>
                          </Group>
                        );
                      })
                    )}
                  </Flex>
                </Flex>
              </ScrollArea>
            </Box>
          ),
        )
      )}
    </Stack>
  );
}
