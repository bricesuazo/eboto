import CreateElection from "@/components/client/modals/create-election";
import DashboardPageClient from "@/components/client/pages/dashboard";
import { getSession } from "@/utils/auth";
import { db } from "@eboto-mo/db";
import {
  type Election,
  type Commissioner,
  type Voter,
  elections,
  voters,
  Vote,
} from "@eboto-mo/db/schema";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "eBoto Mo | Dashboard",
};

export default async function Page() {
  const session = await getSession();

  const electionsAsCommissioner: (Commissioner & { election: Election })[] =
    await db.query.commissioners.findMany({
      where: (commissioners, { eq }) => eq(commissioners.user_id, session.id),
      with: {
        election: true,
      },
    });

  const electionsAsVoter: (Voter & {
    election: Election & { votes: Vote[] };
  })[] = await db.query.voters.findMany({
    where: (voters, { eq }) => eq(voters.user_id, session.id),
    with: {
      election: {
        // where: (election, { eq }) => not(eq(election.publicity, "PRIVATE")),
        with: {
          votes: {
            where: (votes, { eq }) => eq(votes.voter_id, session.id),
          },
        },
      },
    },
  });

  console.log(
    "🚀 ~ file: page.tsx:25 ~ Page ~ electionsAsCommissioner:",
    electionsAsCommissioner
  );
  console.log(
    "🚀 ~ file: page.tsx:34 ~ Page ~ electionsAsVoter:",
    electionsAsVoter
  );

  return (
    <>
      <DashboardPageClient
        commissioners={electionsAsCommissioner}
        voters={electionsAsVoter}
      />
    </>
  );
}
