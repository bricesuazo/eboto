import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Realtime from "@/components/pages/realtime";
import { api } from "@/trpc/server";
import { createClient as createClientAdmin } from "@/utils/supabase/admin";
import { createClient as createClientServer } from "@/utils/supabase/server";
import { env } from "env.mjs";
import moment from "moment";

import { isElectionEnded, isElectionOngoing } from "@eboto/constants";

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
    .select("id, name, slug, start_date, end_date, logo_path, publicity")
    .eq("slug", electionSlug)
    .is("deleted_at", null)
    .single();

  if (!election) notFound();

  if (user) {
    const { data: voters } = await supabaseAdmin
      .from("voters")
      .select("id")
      .eq("election_id", election.id)
      .eq("email", user?.email ?? "");

    const { data: commissioners } = await supabaseAdmin
      .from("commissioners")
      .select("id")
      .eq("election_id", election.id)
      .eq("user_id", user?.id ?? "");

    if (
      !voters ||
      !commissioners ||
      (election.publicity === "VOTER" &&
        !voters.length &&
        !commissioners.length) ||
      (election.publicity === "PRIVATE" && !commissioners.length)
    )
      notFound();
  }

  let image_url: string | undefined;

  if (election.logo_path) {
    const { data: url } = await supabaseServer.storage
      .from("candidates")
      .createSignedUrl(election.logo_path, 60);

    image_url = url?.signedUrl;
  }

  return {
    title: election.name + " - Realtime Result",
    description: `See realtime result of ${election.name} | eBoto`,
    openGraph: {
      title: election.name,
      description: `See realtime result of ${election.name} | eBoto`,
      images: [
        {
          url: `${
            process.env.NODE_ENV === "production"
              ? "https://eboto.app"
              : "http://localhost:3000"
          }/api/og?type=election&election_name=${encodeURIComponent(
            election.name,
          )}&election_logo=${encodeURIComponent(
            image_url ?? "",
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

export default async function RealtimePage({
  params: { electionSlug },
}: {
  params: { electionSlug: string };
}) {
  const supabaseServer = createClientServer();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();
  const positions = await api.election.getElectionRealtime.query(electionSlug);

  const supabaseAdmin = createClientAdmin();
  const { data: election } = await supabaseAdmin
    .from("elections")
    .select("*, voter_fields(*)")
    .eq("slug", electionSlug)
    .is("deleted_at", null)
    .single();

  if (!election) notFound();

  const { data: voter } = await supabaseAdmin
    .from("voters")
    .select("id")
    .eq("election_id", election.id)
    .eq("email", user?.email ?? "")
    .is("deleted_at", null)
    .single();

  const { data: commissioner } = await supabaseAdmin
    .from("commissioners")
    .select("id")
    .eq("election_id", election.id)
    .eq("user_id", user?.id ?? "")
    .is("deleted_at", null)
    .single();

  let isVoterCanMessage = !!voter && !commissioner;

  const callbackUrl = `/sign-in?callbackUrl=https://eboto.app/${election.slug}/realtime`;

  if (election.publicity === "PRIVATE") {
    isVoterCanMessage = false;
    if (!user) redirect(callbackUrl);

    const { data: isCommissioner } = await supabaseAdmin
      .from("commissioners")
      .select("user:users(email)")
      .eq("election_id", election.id)
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .single();

    if (!isCommissioner?.user) notFound();

    const { data: isVoter } = await supabaseAdmin
      .from("voters")
      .select("id")
      .eq("election_id", election.id)
      .eq("email", isCommissioner.user.email)
      .is("deleted_at", null)
      .single();

    const { data: votes, error: votes_error } = await supabaseAdmin
      .from("votes")
      .select("id")
      .eq("election_id", election.id)
      .eq("voter_id", isVoter?.id ?? "");

    if (votes_error) notFound();

    if (isVoter && votes.length && !isCommissioner)
      redirect(`/${election.slug}`);
  } else if (election.publicity === "VOTER") {
    if (!user) redirect(callbackUrl);

    if (!voter && !commissioner) notFound();

    const { data: votes, error: votes_error } = await supabaseAdmin
      .from("votes")
      .select("id")
      .eq("election_id", election.id)
      .eq("voter_id", voter?.id ?? "");

    if (votes_error) notFound();

    if (
      !isElectionEnded({
        election,
      }) &&
      isElectionOngoing({
        election,
      }) &&
      !votes.length
    )
      redirect(`/${election.slug}`);
  }

  return (
    <Realtime
      positions={positions}
      election={{
        ...election,
        // TODO: Add logo_url
        logo_url: null,
        is_free: election.variant_id === env.LEMONSQUEEZY_FREE_VARIANT_ID,
      }}
      isVoterCanMessage={isVoterCanMessage}
    />
  );
}
