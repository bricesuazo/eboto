import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import {
  Box,
  Center,
  Container,
  Flex,
  Stack,
  Text,
  Title,
} from '@mantine/core';

import DashboardTab from '~/components/dashboard-tab';
import ElectionsLeft from '~/components/elections-left';
import Dashboard from '~/components/layout/dashboard';
import CreateElection from '~/components/modals/create-election';
import {
  MyElectionsAsCommissioner as MyElectionsAsCommissionerClient,
  MyElectionsAsVoter as MyElectionsAsVoterClient,
} from '~/components/my-elections';
import { createClient } from '~/supabase/server';
import { api } from '~/trpc/server';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'eBoto | Dashboard',
};

export default async function Page({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await searchParamsPromise;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/sign-in');

  return (
    <Dashboard>
      <Container size="md" my="md">
        <Stack gap="xl">
          <Flex direction="column" gap="sm" hiddenFrom="xs">
            <CreateElection style={{ width: '100%' }} />
            <Center>
              <ElectionsLeft />
            </Center>
          </Flex>

          <Box>
            <Flex align="center" justify="space-between">
              <Title order={2}>My elections</Title>

              <Flex gap="xs" visibleFrom="xs" align="center">
                <ElectionsLeft />
                <CreateElection />
              </Flex>
            </Flex>

            <Text size="sm" c="grayText" mb="md">
              You can manage the elections below.
            </Text>

            <DashboardTab
              type="manage"
              defaultValue={
                (Array.isArray(searchParams.manage)
                  ? searchParams.manage[0]
                  : searchParams.manage) ?? 'ongoing'
              }
            >
              <MyElectionsAsCommissioner />
            </DashboardTab>
          </Box>

          <Box>
            <Title order={2}>My elections I can vote in</Title>
            <Text size="sm" c="grayText" mb="sm">
              You can vote in the elections below. You can only vote once per
              election.
            </Text>
            <DashboardTab
              type="vote"
              defaultValue={
                (Array.isArray(searchParams.vote)
                  ? searchParams.vote[0]
                  : searchParams.vote) ?? 'ongoing'
              }
            >
              <MyElectionsAsVoter />
            </DashboardTab>
          </Box>
        </Stack>
      </Container>
    </Dashboard>
  );
}

async function MyElectionsAsCommissioner() {
  const electionsAsCommissioner =
    await api.election.getMyElectionAsCommissioner();

  return (
    <MyElectionsAsCommissionerClient initialData={electionsAsCommissioner} />
  );
}
async function MyElectionsAsVoter() {
  const electionsAsVoter = await api.election.getMyElectionAsVoter();
  return <MyElectionsAsVoterClient initialData={electionsAsVoter} />;
}
