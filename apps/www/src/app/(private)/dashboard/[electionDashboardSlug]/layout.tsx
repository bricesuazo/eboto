import { notFound, redirect } from "next/navigation";
import DashboardElection from "@/components/client/layout/dashboard-election";

import { auth } from "@eboto/auth";
import { db } from "@eboto/db";

export default async function DashboardLayout(
  props: React.PropsWithChildren<{ params: { electionDashboardSlug: string } }>,
) {
  const session = await auth();

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
    <DashboardElection userId={session.user.id}>
      {props.children}
    </DashboardElection>
  );
}
