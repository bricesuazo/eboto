import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Realtime from "@/components/pages/realtime";
import { api } from "@/trpc/server";
import { supabase as supabaseAdmin } from "@/utils/supabase/admin";
import { supabase } from "@/utils/supabase/server";
import { env } from "env.mjs";
import moment from "moment";

import { isElectionEnded, isElectionOngoing } from "@eboto/constants";

export async function generateMetadata({
  params: { electionSlug },
}: {
  params: { electionSlug: string };
}): Promise<Metadata> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { data: election } = await supabaseAdmin
    .from("elections")
    .select("id, name, slug, start_date, end_date, logo_path, publicity")
    .eq("slug", electionSlug)
    .is("deleted_at", null)
    .single();

  if (!election) notFound();

  const { data: voters } = await supabaseAdmin
    .from("voters")
    .select("id")
    .eq("election_id", election.id)
    .eq("email", session?.user?.email ?? "");

  const { data: commissioners } = await supabaseAdmin
    .from("commissioners")
    .select("id")
    .eq("election_id", election.id)
    .eq("user_id", session?.user?.id ?? "");

  if (
    !voters ||
    !commissioners ||
    (election.publicity === "VOTER" &&
      !voters.length &&
      !commissioners.length) ||
    (election.publicity === "PRIVATE" && !commissioners.length)
  )
    notFound();

  let image_url: string | undefined;

  if (election.logo_path) {
    const { data: url } = await supabase.storage
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
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const positions = await api.election.getElectionRealtime.query(electionSlug);

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
    .eq("email", session?.user?.email ?? "")
    .is("deleted_at", null)
    .single();

  const { data: commissioner } = await supabaseAdmin
    .from("commissioners")
    .select("id")
    .eq("election_id", election.id)
    .eq("user_id", session?.user.id ?? "")
    .is("deleted_at", null)
    .single();

  let isVoterCanMessage = !!voter && !commissioner;

  const callbackUrl = `/sign-in?callbackUrl=https://eboto.app/${election.slug}/realtime`;

  if (election.publicity === "PRIVATE") {
    isVoterCanMessage = false;
    if (!session) redirect(callbackUrl);

    const { data: isCommissioner } = await supabaseAdmin
      .from("commissioners")
      .select("user:users(email)")
      .eq("election_id", election.id)
      .eq("user_id", session.user.id)
      .is("deleted_at", null)
      .single();

    if (!isCommissioner?.user) notFound();

    // const isVoter = await db.query.voters.findFirst({
    //   where: (voter, { eq, and, isNull }) =>
    //     and(
    //       eq(voter.election_id, election.id),
    //       eq(voter.email, isCommissioner.user.email),
    //       isNull(voter.deleted_at),
    //     ),
    // });

    const { data: isVoter } = await supabaseAdmin
      .from("voters")
      .select("id")
      .eq("election_id", election.id)
      .eq("email", isCommissioner.user.email)
      .is("deleted_at", null)
      .single();

    const { data: vote } = await supabaseAdmin
      .from("votes")
      .select("id")
      .eq("election_id", election.id)
      .eq("voter_id", isVoter?.id ?? "")
      .single();

    if (isVoter && !vote && !isCommissioner) redirect(`/${election.slug}`);
  } else if (election.publicity === "VOTER") {
    if (!session) redirect(callbackUrl);

    const { data: vote } = await supabaseAdmin
      .from("votes")
      .select("id")
      .eq("election_id", election.id)
      .eq("voter_id", voter?.id ?? "")
      .single();

    if (!voter && !commissioner) notFound();

    if (
      !isElectionEnded({
        election,
      }) &&
      isElectionOngoing({
        election,
      }) &&
      !vote
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
