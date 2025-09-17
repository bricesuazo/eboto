import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { Box, Container, Stack, Text, Title } from '@mantine/core';
import moment from 'moment';
import Balancer from 'react-wrap-balancer';

import { isElectionOngoing, parseHourTo12HourFormat } from '@eboto/constants';

import VoteForm from '~/components/vote-form';
import { createClient as createClientAdmin } from '~/supabase/admin';
import { createClient as createClientServer } from '~/supabase/server';
import { api } from '~/trpc/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ electionSlug: string }>;
}): Promise<Metadata> {
  const { electionSlug } = await params;

  const supabaseAdmin = createClientAdmin();
  const { data: election } = await supabaseAdmin
    .from('elections')
    .select('name')
    .eq('slug', electionSlug)
    .is('deleted_at', null)
    .single();

  if (!election) return notFound();

  return {
    title: `${election.name} – Vote`,
  };
}

export default async function VotePage({
  params,
}: {
  params: Promise<{ electionSlug: string }>;
}) {
  const { electionSlug } = await params;

  const supabaseServer = await createClientServer();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  if (!user) redirect(`/sign-in?next=/${electionSlug}/vote`);

  const supabaseAdmin = createClientAdmin();
  const { data: election } = await supabaseAdmin
    .from('elections')
    .select(
      'id, name, slug, publicity, name_arrangement, start_date, end_date, voting_hour_start, voting_hour_end',
    )
    .eq('slug', electionSlug)
    .is('deleted_at', null)
    .single();

  if (!election) notFound();

  if (!isElectionOngoing({ election })) redirect(`/${election.slug}`);

  const { data: voter } = await supabaseAdmin
    .from('voters')
    .select('id, field')
    .eq('email', user.email ?? '')
    .eq('election_id', election.id)
    .is('deleted_at', null)
    .single();

  const { count: voter_fields_count } = await supabaseAdmin
    .from('voter_fields')
    .select('id', { count: 'exact' })
    .eq('election_id', election.id)
    .is('deleted_at', null);

  if (
    voter === null ||
    voter_fields_count === null ||
    (voter_fields_count > 0 && !voter.field) ||
    (voter.field &&
      Object.values(voter.field as Record<string, string>).some(
        (value) => !value || value.trim() === '',
      ))
  )
    redirect(`/${election.slug}`);

  const { count: votes_count } = await supabaseAdmin
    .from('votes')
    .select('id', { count: 'exact' })
    .eq('voter_id', voter.id)
    .eq('election_id', election.id);

  if (votes_count) redirect(`/${election.slug}/realtime`);

  if (election.publicity === 'PRIVATE') {
    const { count: commissioner_count } = await supabaseAdmin
      .from('commissioners')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('election_id', election.id)
      .is('deleted_at', null);

    if (!commissioner_count) notFound();
  } else {
    const { count: votes_count } = await supabaseAdmin
      .from('votes')
      .select('id', { count: 'exact' })
      .eq('voter_id', voter.id)
      .eq('election_id', election.id);

    if (!votes_count) notFound();

    const { count: commissioner_count } = await supabaseAdmin
      .from('commissioners')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('election_id', election.id);

    if (votes_count > 0 && commissioner_count)
      redirect(`/${election.slug}/realtime`);
  }

  const positions = await api.election.getElectionVoting({
    election_id: election.id,
  });

  return (
    <Container py="xl" size="md">
      <Stack pos="relative">
        <Box>
          <Title ta="center">
            <Balancer>Cast your vote for {election.name}</Balancer>
          </Title>
          <Text ta="center">
            <Balancer>Select your candidates for each position.</Balancer>
          </Text>
          <Text ta="center">
            <Balancer>
              {moment(election.start_date).local().format('MMMM DD, YYYY')}
              {' - '}
              {moment(election.end_date).local().format('MMMM DD, YYYY')}
            </Balancer>
          </Text>
          <Text ta="center">
            Voting hours:{' '}
            {election.voting_hour_start === 0 && election.voting_hour_end === 24
              ? 'Whole day'
              : parseHourTo12HourFormat(election.voting_hour_start) +
                ' - ' +
                parseHourTo12HourFormat(election.voting_hour_end)}
          </Text>
        </Box>
        <VoteForm election={election} positions={positions} />
      </Stack>
    </Container>
  );
}
