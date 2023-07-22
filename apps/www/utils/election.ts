'use server';

import { getSession } from '@/utils/auth';
import { db } from '@eboto-mo/db';
import { not } from 'drizzle-orm';

export async function getElectionBySlug(slug: string) {
  return await db.query.elections.findFirst({
    where: (elections, { eq }) => eq(elections.slug, slug),
  });
}

export async function getAllMyElections() {
  const session = await getSession();

  if (!session) throw new Error('Unauthorized');

  return await db.query.commissioners.findMany({
    where: (commissioners, { eq }) => eq(commissioners.user_id, session.id),
    with: {
      election: true,
    },
  });
}

export async function getAllPartylistsWithoutINDByElectionId(id: string) {
  return await db.query.partylists.findMany({
    where: (partylists, { eq, and }) =>
      and(eq(partylists.election_id, id), not(eq(partylists.acronym, 'IND'))),
    orderBy: (partylists, { desc }) => desc(partylists.updated_at),
  });
}
export async function getAllPartylistsByElectionId(id: string) {
  return await db.query.partylists.findMany({
    where: (partylists, { eq }) => eq(partylists.election_id, id),
    orderBy: (partylists, { asc }) => asc(partylists.created_at),
  });
}
export async function getAllPositionsByElectionId(id: string) {
  return await db.query.positions.findMany({
    where: (positions, { eq }) => eq(positions.election_id, id),
    orderBy: (positions, { asc }) => asc(positions.order),
  });
}

export async function getAllCandidatesByElectionId(id: string) {
  return await db.query.positions.findMany({
    where: (positions, { eq }) => eq(positions.election_id, id),
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
}
