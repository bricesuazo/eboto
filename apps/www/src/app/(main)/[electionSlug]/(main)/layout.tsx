import type { Metadata, Route } from 'next';
import { notFound, redirect } from 'next/navigation';
import { env } from 'env';
import moment from 'moment';

import { isElectionOngoing } from '@eboto/constants';

import { createClient as createClientAdmin } from '~/supabase/admin';
import { createClient as createClientServer } from '~/supabase/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ electionSlug: string }>;
}): Promise<Metadata> {
  const { electionSlug } = await params;

  const supabaseServer = await createClientServer();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  const supabaseAdmin = createClientAdmin();
  const { data: election } = await supabaseAdmin
    .from('elections')
    .select()
    .eq('slug', electionSlug)
    .is('deleted_at', null)
    .single();

  if (!election) notFound();

  if (election.publicity === 'PRIVATE') {
    if (!user) notFound();

    const { data: commissioners } = await supabaseAdmin
      .from('commissioners')
      .select()
      .eq('election_id', election.id)
      .eq('user_id', user.id)
      .is('deleted_at', null);

    if (commissioners?.length === 0) notFound();
  } else if (election.publicity === 'VOTER') {
    if (!user) notFound();

    const { data: commissioners } = await supabaseAdmin
      .from('commissioners')
      .select()
      .eq('election_id', election.id)
      .eq('user_id', user.id)
      .is('deleted_at', null);

    const { data: voters } = await supabaseAdmin
      .from('voters')
      .select()
      .eq('election_id', election.id)
      .eq('email', user.email ?? '')
      .is('deleted_at', null);

    if (voters?.length === 0 && commissioners?.length === 0) notFound();
  }

  let logo_url: string | null = null;

  if (election.logo_path) {
    const { data: url } = supabaseServer.storage
      .from('elections')
      .getPublicUrl(election.logo_path);

    logo_url = url.publicUrl;
  }

  return {
    title: election.name,
    description: `See details about ${election.name} | eBoto`,
    openGraph: {
      title: election.name,
      description: `See details about ${election.name} | eBoto`,
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

export default async function ElectionLayout(
  props: React.PropsWithChildren<{ params: Promise<{ electionSlug: string }> }>,
) {
  const { electionSlug } = await props.params;
  const supabaseServer = await createClientServer();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  const supabaseAdmin = createClientAdmin();
  const { data: election } = await supabaseAdmin
    .from('elections')
    .select()
    .eq('slug', electionSlug)
    .is('deleted_at', null)
    .single();

  if (!election) notFound();

  const isOngoing = isElectionOngoing({ election });

  if (election.publicity === 'PRIVATE') {
    if (!user) notFound();

    const { data: commissioner } = await supabaseAdmin
      .from('commissioners')
      .select()
      .eq('election_id', election.id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single();

    if (!commissioner) notFound();
  } else if (election.publicity === 'VOTER') {
    const next = `/sign-in?next=/${electionSlug}`;

    if (!user) redirect(next as Route);

    const { data: voter } = await supabaseAdmin
      .from('voters')
      .select()
      .eq('election_id', election.id)
      .eq('email', user.email ?? '')
      .is('deleted_at', null)
      .single();

    const { data: commissioner } = await supabaseAdmin
      .from('commissioners')
      .select()
      .eq('election_id', election.id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single();

    if (!isOngoing && !voter && !commissioner) notFound();

    if (!voter && !commissioner) redirect(next as Route);
  }

  return <>{props.children}</>;
}
