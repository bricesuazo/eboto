import DashboardVoter from '@/components/client/pages/dashboard-voter';
import { db } from '@eboto-mo/db';
import { type Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Voters',
};

export default async function Page({
  params: { electionDashboardSlug },
}: {
  params: { electionDashboardSlug: string };
}) {
  const election = await db.query.elections.findFirst({
    where: (elections, { eq }) => eq(elections.slug, electionDashboardSlug),
    with: {
      voter_fields: true,
    },
  });
  const voters = await db.query.voters.findMany({
    where: (voters, { eq }) => eq(voters.election_id, election.id),

    with: {
      user: true,
      votes: {
        limit: 1,
      },
    },
  });
  const invitedVoters = await db.query.invited_voters.findMany({
    where: (invited_voters, { eq }) =>
      eq(invited_voters.election_id, election.id),
  });

  const parsedVoters = voters
    .map((voter) => ({
      id: voter.id,
      email: voter.user.email,
      account_status: 'ACCEPTED',
      created_at: voter.created_at,
      has_voted: voter.votes.length > 0,
      field: voter.field,
    }))
    .concat(
      invitedVoters.map((voter) => ({
        id: voter.id,
        email: voter.email,
        account_status: voter.status,
        created_at: voter.created_at,
        has_voted: false,
        field: voter.field,
      })),
    );
  return <DashboardVoter election={election} voters={parsedVoters} />;
}
