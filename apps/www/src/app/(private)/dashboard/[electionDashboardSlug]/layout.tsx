import { notFound, redirect } from "next/navigation";

import { createClient as creatClientAdmin } from "@eboto/supabase/client/admin";
import { createClient as creatClientServer } from "@eboto/supabase/client/server";

import DashboardElection from "~/components/layout/dashboard-election";
import { env } from "~/env";

export default async function DashboardLayout(
  props: React.PropsWithChildren<{
    params: Promise<{ electionDashboardSlug: string }>;
  }>,
) {
  const params = await props.params;
  const supabaseServer = await creatClientServer();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  if (!user) redirect("/sign-in");

  // const election = await db.query.elections.findFirst({
  //   where: (elections, { eq, and, isNull }) =>
  //     and(
  //       eq(elections.slug, props.params.electionDashboardSlug),
  //       isNull(elections.deleted_at),
  //     ),
  //   with: {
  //     commissioners: {
  //       where: (commissioners, { eq, and, isNull }) =>
  //         and(
  //           eq(commissioners.user_id, session.user.id),
  //           isNull(commissioners.deleted_at),
  //         ),
  //       limit: 1,
  //     },
  //   },
  // });
  const supabaseAdmin = creatClientAdmin();

  const { data: election } = await supabaseAdmin
    .from("elections")
    .select()
    .eq("slug", params.electionDashboardSlug)
    .is("deleted_at", null)
    .single();

  if (!election) notFound();

  const { data: commissioners } = await supabaseAdmin
    .from("commissioners")
    .select()
    .eq("election_id", election.id)
    .eq("user_id", user.id)
    .is("deleted_at", null);

  if (!commissioners || commissioners.length === 0) notFound();

  return (
    <DashboardElection
      isLoggedIn={true}
      is_free={
        election.variant_id === env.LEMONSQUEEZY_FREE_VARIANT_ID &&
        election.no_of_voters === null
      }
      election_id={election.id}
    >
      {props.children}
    </DashboardElection>
  );
}
