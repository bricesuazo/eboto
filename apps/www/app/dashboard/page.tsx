import DashboardPageClient from '@/components/client/pages/dashboard';
import { api_server } from '@/shared/server/trpc';
import { db } from '@eboto-mo/db';
import {
  type Commissioner,
  type Election,
  Vote,
  type Voter,
  elections,
  voters,
} from '@eboto-mo/db/schema';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'eBoto Mo | Dashboard',
};

export default async function Page() {
  const session = await api_server.auth.getSession.fetch();

  const electionsAsCommissioner: (Commissioner & { election: Election })[] =
    await db.query.commissioners.findMany({
      where: (commissioners, { eq }) =>
        eq(commissioners.user_id, session.user.id),
      with: {
        election: true,
      },
    });

  const electionsAsVoter: (Voter & {
    election: Election & { votes: Vote[] };
  })[] = await db.query.voters.findMany({
    where: (voters, { eq }) => eq(voters.user_id, session.user.id),
    with: {
      election: {
        with: {
          votes: {
            where: (votes, { eq }) => eq(votes.voter_id, session.user.id),
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
