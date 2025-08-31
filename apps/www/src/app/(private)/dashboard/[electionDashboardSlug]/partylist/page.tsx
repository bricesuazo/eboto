'use client';

import { use } from 'react';
import { Box, Flex, Group, Stack, Text, Title } from '@mantine/core';
import { IconFlag } from '@tabler/icons-react';

import CenterLoader from '~/components/center-loader';
import CreatePartylist from '~/components/modals/create-partylist';
import DeletePartylist from '~/components/modals/delete-partylist';
import EditPartylist from '~/components/modals/edit-partylist';
import classes from '~/styles/Partylist.module.css';
import { api } from '~/trpc/client';

export default function Page({
  params,
}: {
  params: Promise<{ electionDashboardSlug: string }>;
}) {
  const { electionDashboardSlug } = use(params);

  const getDashboardDataQuery = api.partylist.getDashboardData.useQuery({
    election_slug: electionDashboardSlug,
  });

  if (!getDashboardDataQuery.data) return <CenterLoader />;

  return (
    <Stack>
      <CreatePartylist election_id={getDashboardDataQuery.data.election.id} />

      <Group gap="xs">
        {!getDashboardDataQuery.data.partylists.length ? (
          <Text>No partylists yet.</Text>
        ) : (
          getDashboardDataQuery.data.partylists.map((partylist) => (
            <Flex key={partylist.id} className={classes['partylist-card']}>
              <Flex direction="column" align="center">
                <Box>
                  <IconFlag size={40} />
                </Box>
                <Title order={4} style={{ lineClamp: 2 }} ta="center">
                  {partylist.name} ({partylist.acronym})
                </Title>
              </Flex>

              {partylist.acronym !== 'IND' && (
                <Flex gap="xs" justify="center">
                  <EditPartylist partylist={{ ...partylist, logo_url: null }} />
                  <DeletePartylist partylist={partylist} />
                </Flex>
              )}
            </Flex>
          ))
        )}
      </Group>
    </Stack>
  );
}
