import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ElectionPageClient from "@/components/client/pages/election-page";
import { api } from "@/trpc/server";
import { env } from "env.mjs";
import moment from "moment";

import { auth } from "@eboto/auth";
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
      !election.voters.length &&
      !election.commissioners.length) ||
    (election.publicity === "PRIVATE" && !election.commissioners.length)
  )
    notFound();

  return {
    title: election.name,
    description: `See details about ${election.name} | eBoto`,
    openGraph: {
      title: election.name,
      description: `See details about ${election.name} | eBoto`,
      images: [
        {
          url: `${
            env.NODE_ENV === "production"
              ? "https://eboto.app"
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

export default async function ElectionPage({
  params: { electionSlug },
}: {
  params: { electionSlug: string };
}) {
  const getElectionPage = await api.election.getElectionPage.query({
    election_slug: electionSlug,
  });

  return (
    <ElectionPageClient data={getElectionPage} election_slug={electionSlug} />
  );
}
