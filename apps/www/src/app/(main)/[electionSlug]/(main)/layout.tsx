import { notFound, redirect } from "next/navigation";

import { isElectionOngoing } from "@eboto/constants";
import { createClient as createClientAdmin } from "@eboto/supabase/client/admin";
import { createClient as createClientServer } from "@eboto/supabase/client/server";

export default async function ElectionLayout(
  props: React.PropsWithChildren<{ params: Promise<{ electionSlug: string }> }>,
) {
  const params = await props.params;
  const supabaseServer = await createClientServer();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  const supabaseAdmin = createClientAdmin();
  const { data: election } = await supabaseAdmin
    .from("elections")
    .select()
    .eq("slug", params.electionSlug)
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
    const next = `/sign-in?next=/${params.electionSlug}`;

    if (!user) redirect(next);

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

    if (!voter && !commissioner) redirect(next);
  }

  return <>{props.children}</>;
}
