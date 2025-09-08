import type { Metadata, Route } from 'next';
import { notFound, redirect } from 'next/navigation';
import moment from 'moment';

import { isElectionEnded, isElectionOngoing } from '@eboto/constants';
import { env } from '@eboto/env';

import Realtime from '~/components/pages/realtime';
import { createClient as createClientAdmin } from '~/supabase/admin';
import { createClient as createClientServer } from '~/supabase/server';
import { api } from '~/trpc/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ electionSlug: string }>;
}): Promise<Metadata> {
  const { electionSlug } = await params;

  const supabaseServer = await createClientServer();

  const supabaseAdmin = createClientAdmin();
  const { data: election } = await supabaseAdmin
    .from('elections')
    .select('id, name, slug, start_date, end_date, logo_path, publicity')
    .eq('slug', electionSlug)
    .is('deleted_at', null)
    .single();

  if (!election) notFound();

  let logo_url: string | null = null;

  if (election.logo_path) {
    const { data: url } = supabaseServer.storage
      .from('elections')
      .getPublicUrl(election.logo_path);

    logo_url = url.publicUrl;
  }

  return {
    title: election.name + ' - Realtime Result',
    description: `See realtime result of ${election.name} | eBoto`,
    openGraph: {
      title: election.name,
      description: `See realtime result of ${election.name} | eBoto`,
      images: [
        {
          url: `${
            env.NODE_ENV === 'production'
              ? 'https://eboto.app'
              : 'http://localhost:3000'
          }/api/og?type=election&election_name=${encodeURIComponent(
            election.name,
          )}&election_logo=${encodeURIComponent(
            logo_url ?? '',
          )}&election_date=${encodeURIComponent(
            moment(election.start_date).format('MMMM D, YYYY') +
              ' - ' +
              moment(election.end_date).format('MMMM D, YYYY'),
          )}`,
          width: 1200,
          height: 630,
          alt: election.name,
        },
      ],
    },
  };
}

export default async function RealtimePage({
  params,
}: {
  params: Promise<{ electionSlug: string }>;
}) {
  const { electionSlug } = await params;

  const supabaseServer = await createClientServer();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();
  const positions = await api.election.getElectionRealtime(electionSlug);

  const supabaseAdmin = createClientAdmin();
  const { data: election } = await supabaseAdmin
    .from('elections')
    .select('*, voter_fields(*)')
    .eq('slug', electionSlug)
    .is('deleted_at', null)
    .single();

  if (!election) notFound();

  const { data: voter } = await supabaseAdmin
    .from('voters')
    .select('id')
    .eq('election_id', election.id)
    .eq('email', user?.email ?? '')
    .is('deleted_at', null)
    .single();

  const { data: commissioner } = await supabaseAdmin
    .from('commissioners')
    .select('id')
    .eq('election_id', election.id)
    .eq('user_id', user?.id ?? '')
    .is('deleted_at', null)
    .single();

  let isVoterCanMessage = !!voter && !commissioner;

  const next = `/sign-in?next=/${election.slug}/realtime`;

  if (election.publicity === 'PRIVATE') {
    isVoterCanMessage = false;
    if (!user) redirect(next as Route);

    const { data: isCommissioner } = await supabaseAdmin
      .from('commissioners')
      .select('user:users(email)')
      .eq('election_id', election.id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single();

    if (!isCommissioner?.user) notFound();

    const { data: isVoter } = await supabaseAdmin
      .from('voters')
      .select('id')
      .eq('election_id', election.id)
      .eq('email', isCommissioner.user.email)
      .is('deleted_at', null)
      .single();

    const { data: votes, error: votes_error } = await supabaseAdmin
      .from('votes')
      .select('id')
      .eq('election_id', election.id)
      .eq('voter_id', isVoter?.id ?? '');

    if (votes_error) notFound();

    if (isVoter && votes.length) redirect(`/${election.slug}`);
  } else if (election.publicity === 'VOTER') {
    if (!user) redirect(next as Route);

    if (!voter && !commissioner) notFound();

    const votes: { id: string }[] = [];
    if (voter) {
      const { data, error: votes_error } = await supabaseAdmin
        .from('votes')
        .select('id')
        .eq('election_id', election.id)
        .eq('voter_id', voter.id);

      if (votes_error) notFound();

      votes.push(...data);
    }

    if (
      !isElectionEnded({
        election,
      }) &&
      isElectionOngoing({
        election,
      }) &&
      !voter &&
      !votes.length &&
      !commissioner
    )
      redirect(`/${election.slug}`);
  }

  let logo_url: string | null = null;

  if (election.logo_path) {
    const { data: image } = supabaseServer.storage
      .from('elections')
      .getPublicUrl(election.logo_path);

    logo_url = image.publicUrl;
  }
  return (
    <Realtime
      positions={positions}
      election={{
        ...election,
        logo_url,
        is_free:
          election.variant_id === env.LEMONSQUEEZY_FREE_VARIANT_ID &&
          election.no_of_voters === null,
      }}
      isVoterCanMessage={isVoterCanMessage}
    />
  );
}
