import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ElectionPageClient from "@/components/pages/election-page";
import { api } from "@/trpc/server";
import { createClient as createClientAdmin } from "@/utils/supabase/admin";
import { createClient as createClientServer } from "@/utils/supabase/server";
import { env } from "env.mjs";
import moment from "moment";

export async function generateMetadata({
  params: { electionSlug },
}: {
  params: { electionSlug: string };
}): Promise<Metadata> {
  const supabaseServer = createClientServer();
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

  const { data: voters, error: voters_error } = await supabaseAdmin
    .from("voters")
    .select()
    .eq("election_id", election.id)
    .eq("email", user?.email ?? "")
    .is("deleted_at", null);

  const { data: commissioners, error: commissioners_error } =
    await supabaseAdmin
      .from("commissioners")
      .select()
      .eq("election_id", election.id)
      .eq("user_id", user?.id ?? "")
      .is("deleted_at", null);

  if (!!voters_error || !!commissioners_error) notFound();

  if (
    (election.publicity === "VOTER" &&
      !voters.length &&
      !commissioners.length) ||
    (election.publicity === "PRIVATE" && !commissioners.length)
  )
    notFound();

  let election_logo_url: string | undefined;

  if (election.logo_path) {
    const { data: url, error: url_error } = await supabaseServer.storage
      .from("elections")
      .createSignedUrl(election.logo_path, 60);

    if (url_error) notFound();

    election_logo_url = url.signedUrl;
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
            election_logo_url ?? "",
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
  params: { electionSlug },
}: {
  params: { electionSlug: string };
}) {
  const getElectionPage = await api.election.getElectionPage.query({
    election_slug: electionSlug,
  });

  return (
    <ElectionPageClient
      data={getElectionPage}
      election_slug={electionSlug}
      is_free={
        getElectionPage.election.variant_id === env.LEMONSQUEEZY_FREE_VARIANT_ID
      }
    />
  );
}
