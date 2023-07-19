"use server";

import { db } from "@eboto-mo/db";
import { getSession } from "@/utils/auth";
import { not } from "drizzle-orm";

export async function getElectionBySlug(slug: string) {
  return await db.query.elections.findFirst({
    where: (elections, { eq }) => eq(elections.slug, slug),
  });
}

export async function getAllMyElections() {
  const session = await getSession();

  if (!session) throw new Error("Unauthorized");

  return await db.query.commissioners.findMany({
    where: (commissioners, { eq }) => eq(commissioners.user_id, session.id),
    with: {
      election: true,
    },
  });
}

export async function getAllPartylistsByElectionId(id: string) {
  return await db.query.partylists.findMany({
    where: (partylists, { eq, and }) =>
      and(eq(partylists.election_id, id), not(eq(partylists.acronym, "IND"))),
    orderBy: (partylists, { desc }) => desc(partylists.updated_at),
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
          credentials: true,
          platforms: true,
        },
      },
    },
  });
}
