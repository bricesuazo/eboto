import { notFound, redirect } from "next/navigation";
import DashboardElection from "@/components/layout/dashboard-election";
import { createClient } from "@/utils/supabase/server";
import { env } from "env.mjs";

import { db } from "@eboto/db";

export default async function DashboardLayout(
  props: React.PropsWithChildren<{ params: { electionDashboardSlug: string } }>,
) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/sign-in");

  const election = await db.query.elections.findFirst({
    where: (elections, { eq, and, isNull }) =>
      and(
        eq(elections.slug, props.params.electionDashboardSlug),
        isNull(elections.deleted_at),
      ),
    with: {
      commissioners: {
        where: (commissioners, { eq, and, isNull }) =>
          and(
            eq(commissioners.user_id, session.user.id),
            isNull(commissioners.deleted_at),
          ),
        limit: 1,
      },
    },
  });

  if (!election || election.commissioners.length === 0) notFound();

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
