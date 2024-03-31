import { notFound, redirect } from "next/navigation";
import DashboardElection from "@/components/layout/dashboard-election";
import { supabase as supabaseAdmin } from "@/utils/supabase/admin";
import { supabase } from "@/utils/supabase/server";
import { env } from "env.mjs";

export default async function DashboardLayout(
  props: React.PropsWithChildren<{ params: { electionDashboardSlug: string } }>,
) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/sign-in");

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

  const { data: election } = await supabaseAdmin
    .from("elections")
    .select()
    .eq("slug", props.params.electionDashboardSlug)
    .is("deleted_at", null)
    .single();

  if (!election) notFound();

  const { data: commissioners } = await supabaseAdmin
    .from("commissioners")
    .select()
    .eq("election_id", election.id)
    .eq("user_id", session.user.id)
    .is("deleted_at", null);

  if (!commissioners || commissioners.length === 0) notFound();

  return (
    <DashboardElection
      userId={session.user.id}
      is_free={election.variant_id === env.LEMONSQUEEZY_FREE_VARIANT_ID}
      election_id={election.id}
    >
      {props.children}
    </DashboardElection>
  );
}
