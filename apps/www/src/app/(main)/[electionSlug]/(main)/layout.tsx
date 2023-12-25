import { notFound, redirect } from "next/navigation";

import { auth } from "@eboto/auth";
import { isElectionOngoing } from "@eboto/constants";
import { db } from "@eboto/db";

export default async function ElectionLayout(
  props: React.PropsWithChildren<{ params: { electionSlug: string } }>,
) {
  const session = await auth();
  const election = await db.query.elections.findFirst({
    where: (elections, { eq, and, isNull }) =>
      and(
        eq(elections.slug, props.params.electionSlug),
        isNull(elections.deleted_at),
      ),
  });

  if (!election) notFound();

  const isOngoing = isElectionOngoing({ election });

  if (election.publicity === "PRIVATE") {
    if (!session) notFound();

    const commissioner = await db.query.commissioners.findFirst({
      where: (commissioner, { eq, and }) =>
        and(
          eq(commissioner.election_id, election.id),
          eq(commissioner.user_id, session.user.id),
        ),
    });

    if (!commissioner) notFound();
  } else if (election.publicity === "VOTER") {
    const callbackUrl = `/sign-in?callbackUrl=https://eboto-mo.com/${props.params.electionSlug}`;

    if (!session) redirect(callbackUrl);

    const voter = await db.query.voters.findFirst({
      where: (voter, { eq, and }) =>
        and(
          eq(voter.election_id, election.id),
          eq(voter.email, session.user.email ?? ""),
        ),
    });

    const commissioner = await db.query.commissioners.findFirst({
      where: (commissioner, { eq, and }) =>
        and(
          eq(commissioner.election_id, election.id),
          eq(commissioner.user_id, session.user.id),
        ),
    });

    if (!isOngoing && !voter && !commissioner) notFound();

    if (!voter && !commissioner) redirect(callbackUrl);
  }

  return <>{props.children}</>;
}
