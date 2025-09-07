'use client';

import { memo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Center,
  Group,
  Skeleton,
  Stack,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
  Text,
} from '@mantine/core';
import { IconArrowDown, IconArrowUp, IconX } from '@tabler/icons-react';
import moment from 'moment';

import { isElectionEnded, isElectionOngoing } from '@eboto/constants';

import { api } from '~/trpc/client';
import DashboardCard from './dashboard-card';

const DashboardTab = memo(function DashboardTab({
  type,
  defaultValue,
}: {
  type: 'vote' | 'manage';
  defaultValue: string;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const manage = Array.isArray(searchParams.get('manage'))
    ? searchParams.get('manage')?.[0]
    : searchParams.get('manage');
  const vote = Array.isArray(searchParams.get('vote'))
    ? searchParams.get('vote')?.[0]
    : searchParams.get('vote');

  const getMyElectionAsCommissionerQuery =
    api.election.getMyElectionAsCommissioner.useQuery(undefined, {
      enabled: type === 'manage',
    });
  const upcoming_elections_as_commissioner =
    getMyElectionAsCommissionerQuery.data?.filter((election) =>
      moment(election.start_date).isAfter(moment()),
    ) ?? [];
  const ongoing_elections_as_commissioner =
    getMyElectionAsCommissionerQuery.data?.filter((election) =>
      isElectionOngoing({ election }),
    ) ?? [];
  const ended_elections_as_commissioner =
    getMyElectionAsCommissionerQuery.data?.filter((election) =>
      isElectionEnded({ election }),
    ) ?? [];

  const getMyElectionAsVoterQuery = api.election.getMyElectionAsVoter.useQuery(
    undefined,
    {
      enabled: type === 'vote',
    },
  );
  const upcoming_elections_as_voter =
    getMyElectionAsVoterQuery.data?.filter((election) =>
      moment(election.start_date).isAfter(moment()),
    ) ?? [];
  const ongoing_elections_as_voter =
    getMyElectionAsVoterQuery.data?.filter((election) =>
      isElectionOngoing({ election }),
    ) ?? [];
  const ended_elections_as_voter =
    getMyElectionAsVoterQuery.data?.filter((election) =>
      isElectionEnded({ election }),
    ) ?? [];

  return (
    <Tabs
      defaultValue={defaultValue}
      inverted
      onChange={(value) => {
        const searchParams = new URLSearchParams(window.location.search);

        if (type === 'vote') {
          if (value) searchParams.set('vote', value);
          if (manage) searchParams.set('manage', manage);
        } else {
          if (value) searchParams.set('manage', value);
          if (vote) searchParams.set('vote', vote);
        }

        router.push(`/dashboard?${searchParams.toString()}`);
      }}
    >
      <Stack>
        <TabsList grow>
          <TabsTab value="ongoing" leftSection={<IconArrowDown />}>
            Ongoing
          </TabsTab>
          <TabsTab value="upcoming" leftSection={<IconArrowUp />}>
            Upcoming
          </TabsTab>
          <TabsTab value="ended" leftSection={<IconX />}>
            Ended
          </TabsTab>
        </TabsList>

        {type === 'manage' ? (
          getMyElectionAsCommissionerQuery.isLoading ? (
            <Loading />
          ) : (
            <>
              <TabsPanel value="ongoing" component={Group}>
                {ongoing_elections_as_commissioner.length === 0 ? (
                  <NoElections type="manage" />
                ) : (
                  ongoing_elections_as_commissioner.map((election) => (
                    <DashboardCard
                      key={election.id}
                      election={election}
                      type="manage"
                    />
                  ))
                )}
              </TabsPanel>
              <TabsPanel value="upcoming" component={Group}>
                {upcoming_elections_as_commissioner.length === 0 ? (
                  <NoElections type="manage" />
                ) : (
                  upcoming_elections_as_commissioner.map((election) => (
                    <DashboardCard
                      key={election.id}
                      election={election}
                      type="manage"
                    />
                  ))
                )}
              </TabsPanel>
              <TabsPanel value="ended" component={Group}>
                {ended_elections_as_commissioner.length === 0 ? (
                  <NoElections type="manage" />
                ) : (
                  ended_elections_as_commissioner.map((election) => (
                    <DashboardCard
                      key={election.id}
                      election={election}
                      type="manage"
                    />
                  ))
                )}
              </TabsPanel>
            </>
          )
        ) : getMyElectionAsVoterQuery.isLoading ? (
          <Loading />
        ) : (
          <>
            <TabsPanel value="ongoing" component={Group}>
              {ongoing_elections_as_voter.length === 0 ? (
                <NoElections type="vote" />
              ) : (
                ongoing_elections_as_voter.map((election) => (
                  <DashboardCard
                    key={election.id}
                    election={election}
                    type="vote"
                    votes={election.votes}
                  />
                ))
              )}
            </TabsPanel>
            <TabsPanel value="upcoming" component={Group}>
              {upcoming_elections_as_voter.length === 0 ? (
                <NoElections type="vote" />
              ) : (
                upcoming_elections_as_voter.map((election) => (
                  <DashboardCard
                    key={election.id}
                    election={election}
                    type="vote"
                    votes={election.votes}
                  />
                ))
              )}
            </TabsPanel>
            <TabsPanel value="ended" component={Group}>
              {ended_elections_as_voter.length === 0 ? (
                <NoElections type="vote" />
              ) : (
                ended_elections_as_voter.map((election) => (
                  <DashboardCard
                    key={election.id}
                    election={election}
                    type="vote"
                    votes={election.votes}
                  />
                ))
              )}
            </TabsPanel>
          </>
        )}
      </Stack>
    </Tabs>
  );
});

export default DashboardTab;

function NoElections({ type }: { type: 'manage' | 'vote' }) {
  return (
    <Center w="100%" h={72}>
      <Text>No {type === 'vote' && 'vote '}elections found</Text>
    </Center>
  );
}

function Loading() {
  return (
    <Group>
      {[...Array(3).keys()].map((i) => (
        <Skeleton key={i} maw={288} h={400} radius="md" />
      ))}
    </Group>
  );
}
