import DashboardCandidate from "@/components/client/pages/dashboard-candidate";
import { db } from "@eboto-mo/db";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Candidates",
};

export default async function Page({
  params: { electionDashboardSlug },
}: {
  params: { electionDashboardSlug: string };
}) {
  const election = await db.query.elections.findFirst({
    where: (elections, { eq }) => eq(elections.slug, electionDashboardSlug),
  });

  if (!election) notFound();

  // const positionsWithCandidates =
  //   await electionCaller.getAllCandidatesByElectionId({
  //     election_id: election.id,
  //   });
  // const partylists = await electionCaller.getAllPartylistsByElectionId({
  //   election_id: election.id,
  // });
  // const positions = await electionCaller.getAllPositionsByElectionId({
  //   election_id: election.id,
  // });
  const positionsWithCandidates = await db.query.positions.findMany({
    where: (positions, { eq }) => eq(positions.election_id, election.id),
    orderBy: (positions, { asc }) => asc(positions.order),
    with: {
      candidates: {
        with: {
          partylist: true,
          credential: {
            columns: {
              id: true,
            },
            with: {
              affiliations: {
                columns: {
                  id: true,
                  org_name: true,
                  org_position: true,
                  start_year: true,
                  end_year: true,
                },
              },
              achievements: {
                columns: {
                  id: true,
                  name: true,
                  year: true,
                },
              },
              events_attended: {
                columns: {
                  id: true,
                  name: true,
                  year: true,
                },
              },
            },
          },
          platforms: {
            columns: {
              id: true,
              title: true,
              description: true,
            },
          },
        },
      },
    },
  });
  const partylists = await db.query.partylists.findMany({
    where: (partylists, { eq }) => eq(partylists.election_id, election.id),
    orderBy: (partylists, { asc }) => asc(partylists.created_at),
  });

  const positions = await db.query.positions.findMany({
    where: (positions, { eq }) => eq(positions.election_id, election.id),
    orderBy: (positions, { asc }) => asc(positions.order),
  });

  return (
    <DashboardCandidate
      election={election}
      positionsWithCandidates={positionsWithCandidates}
      partylists={partylists}
      positions={positions}
    />
  );
}
