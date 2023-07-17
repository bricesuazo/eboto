import { db } from "@eboto-mo/db";

export async function getElectionBySlug(slug: string) {
  return await db.query.elections.findFirst({
    where: (elections, { eq }) => eq(elections.slug, slug),
  });
}
