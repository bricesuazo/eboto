import DashboardPageClient from "@/components/client/pages/dashboard";
import { auth } from "@clerk/nextjs";
import { db } from "@eboto-mo/db";
import type { Commissioner, Election, Vote, Voter } from "@eboto-mo/db/schema";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "eBoto Mo | Dashboard",
};

export default async function Page() {
  const { userId } = auth();

  if (!userId) notFound();

  const electionsAsCommissioner: (Commissioner & { election: Election })[] =
    await db.query.commissioners.findMany({
      where: (commissioners, { eq }) => eq(commissioners.user_id, userId),
      with: {
        election: true,
      },
    });

  const electionsAsVoter: (Voter & {
    election: Election & { votes: Vote[] };
  })[] = await db.query.voters.findMany({
    where: (voters, { eq }) => eq(voters.user_id, userId),
    with: {
      election: {
        with: {
          votes: {
            where: (votes, { eq }) => eq(votes.voter_id, userId),
          },
        },
      },
    },
  });

  return (
    <>
      <DashboardPageClient
        commissioners={electionsAsCommissioner}
        voters={electionsAsVoter}
      />
    </>
  );
}
