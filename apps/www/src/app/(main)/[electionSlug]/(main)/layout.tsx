import { notFound, redirect } from "next/navigation";
import { createClient as createClientAdmin } from "@/utils/supabase/admin";
import { createClient as createClientServer } from "@/utils/supabase/server";

import { isElectionOngoing } from "@eboto/constants";

export default async function ElectionLayout(
  props: React.PropsWithChildren<{ params: { electionSlug: string } }>,
) {
  const supabaseServer = createClientServer();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  const supabaseAdmin = createClientAdmin();
  const { data: election } = await supabaseAdmin
    .from("elections")
    .select()
    .eq("slug", props.params.electionSlug)
    .is("deleted_at", null)
    .single();

  if (!election) notFound();

  const isOngoing = isElectionOngoing({ election });

  if (election.publicity === "PRIVATE") {
    if (!user) notFound();

    const { data: commissioner } = await supabaseAdmin
      .from("commissioners")
      .select()
      .eq("election_id", election.id)
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .single();

    if (!commissioner) notFound();
  } else if (election.publicity === "VOTER") {
    const callbackUrl = `/sign-in?callbackUrl=https://eboto.app/${props.params.electionSlug}`;

    if (!user) redirect(callbackUrl);

    const { data: voter } = await supabaseAdmin
      .from("voters")
      .select()
      .eq("election_id", election.id)
      .eq("email", user.email ?? "")
      .is("deleted_at", null)
      .single();

    const { data: commissioner } = await supabaseAdmin
      .from("commissioners")
      .select()
      .eq("election_id", election.id)
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .single();

    if (!isOngoing && !voter && !commissioner) notFound();

    if (!voter && !commissioner) redirect(callbackUrl);
  }

  return <>{props.children}</>;
}
