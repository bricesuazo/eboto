"use server";

import { db } from "@eboto-mo/db";
import { getSession } from "@/utils/auth";

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
