import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ElectionPageClient from "@/components/client/pages/election-page";
import { api } from "@/trpc/server";
import { env } from "env.mjs";
import moment from "moment";

import { db } from "@eboto-mo/db";

export async function generateMetadata({
  params: { electionSlug },
}: {
  params: { electionSlug: string };
}): Promise<Metadata> {
  const election = await db.query.elections.findFirst({
    where: (election, { eq, and, isNull }) =>
      and(eq(election.slug, electionSlug), isNull(election.deleted_at)),
  });

  if (!election) notFound();

  return {
    title: election.name,
    description: `See details about ${election.name} | eBoto Mo`,
    openGraph: {
      title: election.name,
      description: `See details about ${election.name} | eBoto Mo`,
      images: [
        {
          url: `${
            env.NODE_ENV === "production"
              ? "https://eboto-mo.com"
              : "http://localhost:3000"
          }/api/og?type=election&election_name=${encodeURIComponent(
            election.name,
          )}&election_logo=${encodeURIComponent(
            election.logo ?? "",
          )}&election_date=${encodeURIComponent(
            moment(election.start_date).format("MMMM D, YYYY hA") +
              " - " +
              moment(election.end_date).format("MMMM D, YYYY hA"),
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
