import { isElectionOngoing } from "@/utils";
import { auth } from "@clerk/nextjs";
import { db } from "@eboto-mo/db";
import { isNull } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";

export default async function ElectionLayout(
  props: React.PropsWithChildren<{ params: { electionSlug: string } }>,
) {
  const { userId } = auth();
  const election = await db.query.elections.findFirst({
    where: (elections, { eq, and }) =>
      and(
        eq(elections.slug, props.params.electionSlug),
        isNull(elections.deleted_at),
      ),
  });

  if (!election) notFound();

  const isOngoing = isElectionOngoing({ election });

  if (election.publicity === "PRIVATE") {
    if (!userId) notFound();

    const commissioner = await db.query.commissioners.findFirst({
      where: (commissioner, { eq, and }) =>
        and(
          eq(commissioner.election_id, election.id),
          eq(commissioner.user_id, userId),
        ),
    });

    if (!commissioner) notFound();
  } else if (election.publicity === "VOTER") {
    const callbackUrl = `/sign-in?callbackUrl=https://eboto-mo.com/${props.params.electionSlug}`;
    if (!userId) redirect(callbackUrl);

    const voter = await db.query.voters.findFirst({
      where: (voter, { eq, and }) =>
        and(eq(voter.election_id, election.id), eq(voter.user_id, userId)),
    });

    const commissioner = await db.query.commissioners.findFirst({
      where: (commissioner, { eq, and }) =>
        and(
          eq(commissioner.election_id, election.id),
          eq(commissioner.user_id, userId),
        ),
    });

    if (!isOngoing && (!voter || !commissioner)) notFound();

    if (!voter && !commissioner) redirect(callbackUrl);
  }
  return <>{props.children}</>;
}
