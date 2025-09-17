import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { formatName } from '@eboto/constants';
import { env } from '@eboto/env';

import { createClient as createClientAdmin } from '~/supabase/admin';
import { createClient as createClientServer } from '~/supabase/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ electionSlug: string; candidateSlug: string }>;
}): Promise<Metadata> {
  const { electionSlug, candidateSlug } = await params;

  const supabaseServer = await createClientServer();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  const supabaseAdmin = createClientAdmin();
  const { data: election } = await supabaseAdmin
    .from('elections')
    .select('id, name, name_arrangement, publicity')
    .eq('slug', electionSlug)
    .is('deleted_at', null)
    .single();

  if (!election) notFound();

  if (election.publicity === 'PRIVATE') {
    if (!user) notFound();

    const { data: commissioners } = await supabaseAdmin
      .from('commissioners')
      .select('id')
      .eq('election_id', election.id)
      .eq('user_id', user.id)
      .is('deleted_at', null);

    if (commissioners?.length === 0) notFound();
  } else if (election.publicity === 'VOTER') {
    if (!user) notFound();

    const { data: commissioners } = await supabaseAdmin
      .from('commissioners')
      .select('id')
      .eq('election_id', election.id)
      .eq('user_id', user.id)
      .is('deleted_at', null);

    const { data: voters } = await supabaseAdmin
      .from('voters')
      .select('id')
      .eq('election_id', election.id)
      .eq('email', user.email ?? '')
      .is('deleted_at', null);

    if (commissioners?.length === 0 && voters?.length === 0) notFound();
  }

  const { data: candidate } = await supabaseAdmin
    .from('candidates')
    .select(
      'first_name, middle_name, last_name, image_path, position: positions(name)',
    )
    .eq('election_id', election.id)
    .eq('slug', candidateSlug)
    .is('deleted_at', null)
    .single();

  if (!candidate?.position) return notFound();

  let image_url: string | null = null;

  if (candidate.image_path) {
    const { data: image } = supabaseServer.storage
      .from('candidates')
      .getPublicUrl(candidate.image_path);

    image_url = image.publicUrl;
  }

  return {
    title: `${formatName(election.name_arrangement, candidate)} – ${
      election.name
    }`,
    description: `See information about ${candidate.first_name} ${candidate.last_name} | eBoto`,
    openGraph: {
      title: election.name,
      description: `See information about ${candidate.first_name} ${candidate.last_name} | eBoto`,
      images: [
        {
          url: `${
            env.NODE_ENV === 'production'
              ? 'https://eboto.app'
              : 'http://localhost:3000'
          }/api/og?type=candidate&candidate_name=${encodeURIComponent(
            candidate.first_name,
          )}${
            (candidate.middle_name &&
              `%20${encodeURIComponent(candidate.middle_name)}`) ??
            ''
          }%20${encodeURIComponent(
            candidate.last_name,
          )}&candidate_position=${encodeURIComponent(
            candidate.position.name,
          )}&candidate_img=${encodeURIComponent(image_url ?? '')}`,
          width: 1200,
          height: 630,
          alt: election.name,
        },
      ],
    },
  };
}

export default function CandidateLayout(props: React.PropsWithChildren) {
  return <>{props.children}</>;
}
