import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Realtime from "@/components/client/pages/realtime";
import { api } from "@/trpc/server";
import moment from "moment";

import { auth } from "@eboto/auth";
import { isElectionEnded, isElectionOngoing } from "@eboto/constants";
import { db } from "@eboto/db";

export async function generateMetadata({
  params: { electionSlug },
}: {
  params: { electionSlug: string };
}): Promise<Metadata> {
  const session = await auth();
  const election = await db.query.elections.findFirst({
    where: (election, { eq, and, isNull }) =>
      and(eq(election.slug, electionSlug), isNull(election.deleted_at)),
    with: {
      voters: {
        where: (voters, { isNull, and, eq }) =>
          and(
            isNull(voters.deleted_at),
            eq(voters.email, session?.user?.email ?? ""),
          ),
      },
      commissioners: {
        where: (commissioners, { isNull, and, eq }) =>
          and(
            isNull(commissioners.deleted_at),
            eq(commissioners.user_id, session?.user?.id ?? ""),
          ),
      },
    },
  });

  if (
    !election ||
    (election.publicity === "VOTER" &&
      !election.voters &&
      !election.commissioners.length) ||
    (election.publicity === "PRIVATE" && !election.commissioners.length)
  )
    notFound();

  return {
    title: election.name + " - Realtime Result",
    description: `See realtime result of ${election.name} | eBoto`,
    openGraph: {
      title: election.name,
      description: `See realtime result of ${election.name} | eBoto`,
      images: [
        {
          url: `${
            process.env.NODE_ENV === "production"
              ? "https://eboto-mo.com"
              : "http://localhost:3000"
          }/api/og?type=election&election_name=${encodeURIComponent(
            election.name,
          )}&election_logo=${encodeURIComponent(
            election.logo?.url ?? "",
          )}&election_date=${encodeURIComponent(
            moment(election.start_date).format("MMMM D, YYYY") +
              " - " +
              moment(election.end_date).format("MMMM D, YYYY"),
          )}`,
          width: 1200,
          height: 630,
          alt: election.name,
        },
      ],
    },
  };
}

export default async function RealtimePage({
  params: { electionSlug },
}: {
  params: { electionSlug: string };
}) {
  const session = await auth();
  const election = await db.query.elections.findFirst({
    where: (election, { eq, and, isNull }) =>
      and(eq(election.slug, electionSlug), isNull(election.deleted_at)),
  });
  const positions = await api.election.getElectionRealtime.query(electionSlug);

  if (!election) notFound();

  const isVoter = await db.query.voters.findFirst({
    where: (voter, { eq, and, isNull }) =>
      and(
        eq(voter.election_id, election.id),
        eq(voter.email, session?.user.email ?? ""),
        isNull(voter.deleted_at),
      ),
  });

  const isCommissioner = await db.query.commissioners.findFirst({
    where: (commissioner, { eq, and, isNull }) =>
      and(
        eq(commissioner.election_id, election.id),
        eq(commissioner.user_id, session?.user.id ?? ""),
        isNull(commissioner.deleted_at),
      ),
  });

  let isVoterCanMessage = !!isVoter && !isCommissioner;

  const callbackUrl = `/sign-in?callbackUrl=https://eboto-mo.com/${election.slug}/realtime`;

  if (election.publicity === "PRIVATE") {
    isVoterCanMessage = false;
    if (!session) redirect(callbackUrl);

    const isCommissioner = await db.query.commissioners.findFirst({
      where: (commissioner, { eq, and, isNull }) =>
        and(
          eq(commissioner.election_id, election.id),
          eq(commissioner.user_id, session.user.id),
          isNull(commissioner.deleted_at),
        ),
      with: {
        user: true,
      },
    });

    if (!isCommissioner) notFound();

    const isVoter = await db.query.voters.findFirst({
      where: (voter, { eq, and, isNull }) =>
        and(
          eq(voter.election_id, election.id),
          eq(voter.email, isCommissioner.user.email),
          isNull(voter.deleted_at),
        ),
    });

    const vote = await db.query.votes.findFirst({
      where: (vote, { eq, and }) =>
        and(
          eq(vote.election_id, election.id),
          eq(vote.voter_id, isVoter?.id ?? ""),
        ),
    });

    if (isVoter && !vote) redirect(`/${election.slug}`);
  } else if (election.publicity === "VOTER") {
    if (!session) redirect(callbackUrl);

    const vote = await db.query.votes.findFirst({
      where: (votes, { eq, and }) =>
        and(
          eq(votes.election_id, election.id),
          eq(votes.voter_id, isVoter?.id ?? ""),
        ),
    });

    if (!isVoter && !isCommissioner) notFound();

    if (
      !isElectionEnded({
        election,
      }) &&
      isElectionOngoing({
        election,
      }) &&
      !vote
    )
      redirect(`/${election.slug}`);
  }
  return (
    <Realtime
      positions={positions}
      election={election}
      isVoterCanMessage={isVoterCanMessage}
    />
  );
}
