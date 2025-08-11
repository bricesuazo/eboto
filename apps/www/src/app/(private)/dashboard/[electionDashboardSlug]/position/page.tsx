'use client';

import { use } from 'react';
import {
  ActionIcon,
  Box,
  Flex,
  Group,
  Popover,
  PopoverDropdown,
  PopoverTarget,
  Stack,
  Text,
} from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';

import CenterLoader from '~/components/center-loader';
import CreatePosition from '~/components/modals/create-position';
import DeletePosition from '~/components/modals/delete-position';
import EditPosition from '~/components/modals/edit-position';
import classes from '~/styles/Position.module.css';
import { api } from '~/trpc/client';

export default function Page({
  params,
}: {
  params: Promise<{ electionDashboardSlug: string }>;
}) {
  const { electionDashboardSlug } = use(params);

  const getDashboardDataQuery = api.position.getDashboardData.useQuery({
    election_slug: electionDashboardSlug,
  });

  if (!getDashboardDataQuery.data) return <CenterLoader />;

  return (
    <Stack>
      <CreatePosition election_id={getDashboardDataQuery.data.election.id} />

      <Group gap="xs">
        {!getDashboardDataQuery.data.positions.length ? (
          <Text>No positions yet.</Text>
        ) : (
          getDashboardDataQuery.data.positions.map((position) => (
            <Stack key={position.id} className={classes['position-card']}>
              {/* <Text>{i + 1}</Text> */}

              <Box>
                <Text fw="bold" ta="center">
                  {position.name}
                </Text>

                <Flex align="center" justify="center" gap={4}>
                  <Text fz="sm" ta="center">
                    {`${
                      position.min === 0
                        ? position.max === 1
                          ? 'Single '
                          : 'Up to ' + position.max
                        : `${position.min} - ${position.max}`
                    } candidate${
                      position.max - position.min > 1 || position.min > 0
                        ? 's'
                        : ''
                    }`}
                  </Text>
                  <Popover width={240} position="bottom" withArrow shadow="md">
                    <PopoverTarget>
                      <ActionIcon
                        size="xs"
                        color="gray"
                        variant="subtle"
                        radius="xl"
                        aria-label="Publicity information"
                      >
                        <IconInfoCircle />
                      </ActionIcon>
                    </PopoverTarget>
                    <PopoverDropdown>
                      <Text size="sm">
                        This position allows voters to vote for{' '}
                        {position.min === 0
                          ? position.max === 1
                            ? ' one'
                            : ` up to ${position.max}`
                          : ` a minimum of ${position.min} and a maximum of ${position.max}`}{' '}
                        candidate
                        {position.max - position.min > 1 || position.min > 0
                          ? 's'
                          : ''}
                        .
                      </Text>
                    </PopoverDropdown>
                  </Popover>
                </Flex>
              </Box>

              <Flex gap="xs">
                <EditPosition position={position} />
                <DeletePosition position={position} />
              </Flex>
            </Stack>
          ))
        )}
      </Group>
    </Stack>
  );
}
