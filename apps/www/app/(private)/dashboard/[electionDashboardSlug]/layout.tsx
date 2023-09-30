import DashboardElection from "@/components/client/layout/dashboard-election";
import { auth } from "@eboto-mo/auth";
import { db } from "@eboto-mo/db";
import { isNull } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";

export default async function DashboardLayout(
  props: React.PropsWithChildren<{ params: { electionDashboardSlug: string } }>,
) {
  const session = await auth();

  if (!session)
    return redirect("/sign-in");

  const election = await db.query.elections.findFirst({
    where: (election, { eq, and }) =>
      and(
        eq(election.slug, props.params.electionDashboardSlug),
        isNull(election.deleted_at),
      ),
  });

  if (!election) notFound();

  return (
    <DashboardElection userId={session.user.id}>{props.children}</DashboardElection>
  );
}
