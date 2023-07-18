"use server";

import { cookies } from "next/headers";
import z from "zod";
import { positionTemplate, takenSlugs } from "@/constants";
import { db } from "@eboto-mo/db";
import {
  elections,
  type Election,
  commissioners,
  partylists,
  positions,
} from "@eboto-mo/db/schema";
import { getSession } from "@/utils/auth";
import {
  type CreateElectionSchema,
  createElectionSchema,
} from "@/utils/zod-schema";

export async function toggleTheme() {
  cookies().get("theme") && cookies().get("theme").value === "dark"
    ? cookies().set("theme", "light")
    : cookies().set("theme", "dark");
}

export async function createElection(input: CreateElectionSchema) {
  createElectionSchema.parse(input);

  const session = await getSession();

  if (!session) throw new Error("Unauthorized");

  if (takenSlugs.includes(input.slug.trim().toLowerCase())) {
    throw new Error("Election slug is already exists");
  }

  const isElectionExists: Election | null = await db.query.elections.findFirst({
    where: (elections, { eq }) =>
      eq(elections.slug, input.slug.trim().toLowerCase()),
  });

  if (isElectionExists) {
    throw new Error("Election slug is already exists");
  }

  const id = crypto.randomUUID();
  await db.insert(elections).values({
    id,
    name: input.name,
    slug: input.slug.trim().toLowerCase(),
    start_date: input.start_date,
    end_date: input.end_date,
  });
  await db.insert(commissioners).values({
    id: crypto.randomUUID(),
    election_id: id,
    user_id: session.id,
  });
  await db.insert(partylists).values({
    id: crypto.randomUUID(),
    name: "Independent",
    acronym: "IND",
    election_id: id,
  });

  if (input.template !== 0)
    await db.insert(positions).values(
      positionTemplate
        .find((template) => template.id === input.template)
        ?.positions.map((position, index) => ({
          id: crypto.randomUUID(),
          name: position,
          election_id: id,
          order: index,
        })) || []
    );
}
