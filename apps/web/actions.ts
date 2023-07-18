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
  UpdateElectionSchema,
  updateElectionSchema,
  CreatePartylistSchema,
  createPartylistSchema,
  UpdatePartylistSchema,
  updatePartylistSchema,
} from "@/utils/zod-schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function toggleTheme() {
  cookies().get("theme") && cookies().get("theme").value === "dark"
    ? cookies().set("theme", "light")
    : cookies().set("theme", "dark");
}

export async function createElection(input: CreateElectionSchema) {
  const parsedInput = createElectionSchema.parse(input);

  const session = await getSession();

  if (!session) throw new Error("Unauthorized");

  if (takenSlugs.includes(parsedInput.slug)) {
    throw new Error("Election slug is already exists");
  }

  const isElectionSlugExists: Election | null =
    await db.query.elections.findFirst({
      where: (elections, { eq }) => eq(elections.slug, parsedInput.slug),
    });

  if (isElectionSlugExists) {
    throw new Error("Election slug is already exists");
  }

  const id = crypto.randomUUID();
  await db.insert(elections).values({
    id,
    name: parsedInput.name,
    slug: parsedInput.slug,
    start_date: parsedInput.start_date,
    end_date: parsedInput.end_date,
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

  if (parsedInput.template !== 0)
    await db.insert(positions).values(
      positionTemplate
        .find((template) => template.id === parsedInput.template)
        ?.positions.map((position, index) => ({
          id: crypto.randomUUID(),
          name: position,
          election_id: id,
          order: index,
        })) || []
    );
}
export async function updateElection(input: UpdateElectionSchema) {
  const parsedInput = updateElectionSchema.parse(input);

  const session = await getSession();

  if (!session) throw new Error("Unauthorized");

  if (parsedInput.newSlug !== parsedInput.oldSlug) {
    if (takenSlugs.includes(parsedInput.newSlug)) {
      throw new Error("Election slug is already exists");
    }

    const isElectionSlugExists: Election | null =
      await db.query.elections.findFirst({
        where: (elections, { eq }) => eq(elections.slug, parsedInput.newSlug),
      });

    if (isElectionSlugExists)
      throw new Error("Election slug is already exists");
  }

  const isElectionCommissionerExists: Election | null =
    await db.query.elections.findFirst({
      with: {
        commissioners: {
          where: (commissioners, { eq }) =>
            eq(commissioners.user_id, session.id),
        },
      },
    });

  if (!isElectionCommissionerExists) throw new Error("Unauthorized");

  await db
    .update(elections)
    .set({
      name: parsedInput.name,
      slug: parsedInput.newSlug,
      description: parsedInput.description,
      start_date: parsedInput.start_date,
      end_date: parsedInput.end_date,
    })
    .where(eq(elections.id, parsedInput.id));
}

export async function createPartylist(input: CreatePartylistSchema) {
  const parsedInput = createPartylistSchema.parse(input);

  const session = await getSession();

  if (!session) throw new Error("Unauthorized");

  await db.insert(partylists).values({
    id: crypto.randomUUID(),
    name: parsedInput.name,
    acronym: parsedInput.acronym,
    election_id: parsedInput.election_id,
  });
  revalidatePath("/election/[electionDashboardSlug]/partylist");
}
export async function updatePartylist(input: UpdatePartylistSchema) {
  const parsedInput = updatePartylistSchema.parse(input);

  const session = await getSession();

  if (!session) throw new Error("Unauthorized");

  await db
    .update(partylists)
    .set({
      name: parsedInput.name,
      acronym: parsedInput.acronym,
      description: parsedInput.description,
      logo_link: parsedInput.logo_link,
    })
    .where(eq(partylists.id, parsedInput.id));

  revalidatePath("/election/[electionDashboardSlug]/partylist");
}
