import DashboardElection from "@/components/client/layout/dashboard-election";
import { auth } from "@clerk/nextjs";
import { db } from "@eboto-mo/db";
import { isNull } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";

export default async function DashboardLayout(
  props: React.PropsWithChildren<{ params: { electionDashboardSlug: string } }>,
) {
  const { userId } = auth();

  if (!userId)
    return redirect(process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? "/sign-in");

  const election = await db.query.elections.findFirst({
    where: (election, { eq, and }) =>
      and(
        eq(election.slug, props.params.electionDashboardSlug),
        isNull(election.deleted_at),
      ),
  });

  if (!election) notFound();

  return (
    <DashboardElection userId={userId}>{props.children}</DashboardElection>
  );
}
