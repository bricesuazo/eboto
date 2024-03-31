import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ElectionCandidate from "@/components/pages/election-candidate";
import { api } from "@/trpc/server";
import { supabase as supabaseAdmin } from "@/utils/supabase/admin";
import { supabase } from "@/utils/supabase/server";
import { env } from "env.mjs";

import { formatName } from "@eboto/constants";

export async function generateMetadata({
  params: { electionSlug, candidateSlug },
}: {
  params: { electionSlug: string; candidateSlug: string };
}): Promise<Metadata> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { data: election } = await supabaseAdmin
    .from("elections")
    .select()
    .eq("slug", electionSlug)
    .is("deleted_at", null)
    .single();

  if (!election) notFound();

  const { data: voters } = await supabaseAdmin
    .from("voters")
    .select()
    .eq("election_id", election.id)
    .eq("email", session?.user?.email ?? "")
    .is("deleted_at", null);

  const { data: commissioners } = await supabaseAdmin
    .from("commissioners")
    .select()
    .eq("election_id", election.id)
    .eq("user_id", session?.user?.id ?? "")
    .is("deleted_at", null);

  if (!voters || !commissioners) notFound();

  if (
    (election.publicity === "VOTER" &&
      !voters.length &&
      !commissioners.length) ||
    (election.publicity === "PRIVATE" && !commissioners.length)
  )
    notFound();

  const { data: candidate } = await supabaseAdmin
    .from("candidates")
    .select("*, position: positions(name)")
    .eq("election_id", election.id)
    .eq("slug", candidateSlug)
    .is("deleted_at", null)
    .single();

  if (!candidate?.position) return notFound();

  let image_url: string | undefined;

  if (candidate.image_path) {
    const { data: url } = await supabase.storage
      .from("candidates")
      .createSignedUrl(candidate.image_path, 60);

    image_url = url?.signedUrl;
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
            env.NODE_ENV === "production"
              ? "https://eboto.app"
              : "http://localhost:3000"
          }/api/og?type=candidate&candidate_name=${encodeURIComponent(
            candidate.first_name,
          )}${
            (candidate.middle_name &&
              `%20${encodeURIComponent(candidate.middle_name ?? "")}`) ??
            ""
          }%20${encodeURIComponent(
            candidate.last_name,
          )}&candidate_position=${encodeURIComponent(
            candidate.position.name,
          )}&candidate_img=${encodeURIComponent(image_url ?? "")}`,
          width: 1200,
          height: 630,
          alt: election.name,
        },
      ],
    },
  };
}

export default async function CandidatePage({
  params: { electionSlug, candidateSlug },
}: {
  params: { electionSlug: string; candidateSlug: string };
}) {
  const data = await api.candidate.getPageData.query({
    candidate_slug: candidateSlug,
    election_slug: electionSlug,
  });

  return (
    <ElectionCandidate
      data={data}
      candidate_slug={candidateSlug}
      election_slug={electionSlug}
      is_free={data.election.variant_id === env.LEMONSQUEEZY_FREE_VARIANT_ID}
    />
  );
}
