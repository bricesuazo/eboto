import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ElectionCandidate from "@/components/pages/election-candidate";
import { api } from "@/trpc/server";
import { createClient } from "@/utils/supabase/server";
import { env } from "env.mjs";

import { formatName } from "@eboto/constants";
import { db } from "@eboto/db";

export async function generateMetadata({
  params: { electionSlug, candidateSlug },
}: {
  params: { electionSlug: string; candidateSlug: string };
}): Promise<Metadata> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const election = await db.query.elections.findFirst({
    where: (election, { eq, and, isNull }) =>
      and(eq(election.slug, electionSlug), isNull(election.deleted_at)),
    with: {
      voters: {
        where: (voters, { isNull, and, eq }) =>
          and(
            isNull(voters.deleted_at),
            eq(voters.email, session?.user?.email ?? ""),
          ),
      },
      commissioners: {
        where: (commissioners, { isNull, and, eq }) =>
          and(
            isNull(commissioners.deleted_at),
            eq(commissioners.user_id, session?.user?.id ?? ""),
          ),
      },
    },
  });

  if (
    !election ||
    (election.publicity === "VOTER" &&
      !election.voters.length &&
      !election.commissioners.length) ||
    (election.publicity === "PRIVATE" && !election.commissioners.length)
  )
    notFound();

  const candidate = await db.query.candidates.findFirst({
    where: (candidates, { eq, and, isNull }) =>
      and(
        eq(candidates.election_id, election.id),
        eq(candidates.slug, candidateSlug),
        isNull(candidates.deleted_at),
      ),
    with: {
      position: {
        columns: {
          name: true,
        },
      },
    },
  });

  if (!candidate) return notFound();

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
          )}&candidate_img=${encodeURIComponent(candidate.image?.url ?? "")}`,
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
