import type { Metadata } from "next";
import { notFound } from "next/navigation";
import moment from "moment";

import { createClient as createClientAdmin } from "@eboto/supabase/client/admin";
import { createClient as createClientServer } from "@eboto/supabase/client/server";

import ElectionPageClient from "~/components/pages/election-page";
import { env } from "~/env";
import { api } from "~/trpc/server";

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
    .from("elections")
    .select()
    .eq("slug", electionSlug)
    .is("deleted_at", null)
    .single();

  if (!election) notFound();

  if (election.publicity === "PRIVATE") {
    if (!user) notFound();

    const { data: commissioners } = await supabaseAdmin
      .from("commissioners")
      .select()
      .eq("election_id", election.id)
      .eq("user_id", user.id)
      .is("deleted_at", null);

    if (commissioners?.length === 0) notFound();
  } else if (election.publicity === "VOTER") {
    if (!user) notFound();

    const { data: commissioners } = await supabaseAdmin
      .from("commissioners")
      .select()
      .eq("election_id", election.id)
      .eq("user_id", user.id)
      .is("deleted_at", null);

    const { data: voters } = await supabaseAdmin
      .from("voters")
      .select()
      .eq("election_id", election.id)
      .eq("email", user.email ?? "")
      .is("deleted_at", null);

    if (voters?.length === 0 && commissioners?.length === 0) notFound();
  }

  let logo_url: string | null = null;

  if (election.logo_path) {
    const { data: url } = supabaseServer.storage
      .from("elections")
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
            env.NODE_ENV === "production"
              ? "https://eboto.app"
              : "http://localhost:3000"
          }/api/og?type=election&election_name=${encodeURIComponent(
            election.name,
          )}&election_logo=${encodeURIComponent(
            logo_url ?? "",
          )}&election_date=${encodeURIComponent(
            moment(election.start_date).format("MMMM D, YYYY") +
              " - " +
              moment(election.end_date).format("MMMM D, YYYY"),
          )}`,
          width: 1200,
          height: 630,
          alt: election.name,
        },
      ],
    },
  };
}

export default async function ElectionPage({
  params,
}: {
  params: Promise<{ electionSlug: string }>;
}) {
  const { electionSlug } = await params;
  const getElectionPage = await api.election.getElectionPage({
    election_slug: electionSlug,
  });

  return (
    <ElectionPageClient
      data={getElectionPage}
      election_slug={electionSlug}
      is_free={
        getElectionPage.election.variant_id ===
          env.LEMONSQUEEZY_FREE_VARIANT_ID &&
        getElectionPage.election.no_of_voters === null
      }
    />
  );
}
