"use server";

import { cookies } from "next/headers";
import { positionTemplate, takenSlugs } from "@/constants";
import { db } from "@eboto-mo/db";
import {
  elections,
  type Election,
  commissioners,
  partylists,
  positions,
  Partylist,
  candidates,
  Candidate,
  voter_fields,
  voters,
  Voter,
  InvitedVoter,
  invited_voters,
} from "@eboto-mo/db/schema";
import { getSession } from "@/utils/auth";
import {
  type CreateElectionSchema,
  createElectionSchema,
  type EditElectionSchema,
  editElectionSchema,
  type CreatePartylistSchema,
  createPartylistSchema,
  type CreatePositionSchema,
  type EditPartylistSchema,
  editPartylistSchema,
  EditPositionSchema,
  editPositionSchema,
  CreateCandidateSchema,
  EditCandidateSchema,
  CreateVoterSchema,
  UpdateVoterFieldSchema,
  DeleteSingleVoterFieldSchema,
  EditVoterSchema,
  DeleteVoterSchema,
} from "@/utils/zod-schema";
import { and, eq } from "drizzle-orm";
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
export async function updateElection(input: EditElectionSchema) {
  const parsedInput = editElectionSchema.parse(input);

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

  const isAcronymExists: Partylist | null = await db.query.partylists.findFirst(
    {
      where: (partylists, { eq, and }) =>
        and(
          eq(partylists.election_id, parsedInput.election_id),
          eq(partylists.acronym, parsedInput.acronym)
        ),
    }
  );

  if (isAcronymExists) throw new Error("Acronym is already exists");

  await db.insert(partylists).values({
    id: crypto.randomUUID(),
    name: parsedInput.name,
    acronym: parsedInput.acronym,
    election_id: parsedInput.election_id,
  });
  revalidatePath("/election/[electionDashboardSlug]/partylist");
}
export async function editPartylist(input: EditPartylistSchema) {
  const parsedInput = editPartylistSchema.parse(input);
  if (parsedInput.newAcronym === "IND")
    throw new Error("Acronym is already exists");

  const session = await getSession();

  if (!session) throw new Error("Unauthorized");

  if (parsedInput.oldAcronym !== parsedInput.newAcronym) {
    const isAcronymExists: Partylist | null =
      await db.query.partylists.findFirst({
        where: (partylists, { eq, and }) =>
          and(
            eq(partylists.election_id, parsedInput.election_id),
            eq(partylists.acronym, parsedInput.newAcronym)
          ),
      });

    if (isAcronymExists) throw new Error("Acronym is already exists");
  }

  await db
    .update(partylists)
    .set({
      name: parsedInput.name,
      acronym: parsedInput.newAcronym,
      description: parsedInput.description,
      logo_link: parsedInput.logo_link,
    })
    .where(eq(partylists.id, parsedInput.id));

  revalidatePath("/election/[electionDashboardSlug]/partylist");
}
export async function deletePartylist(id: string) {
  const session = await getSession();

  if (!session) throw new Error("Unauthorized");

  await db.delete(partylists).where(eq(partylists.id, id));

  revalidatePath("/election/[electionDashboardSlug]/partylist");
}
export async function deleteCandidate(id: string) {
  const session = await getSession();

  if (!session) throw new Error("Unauthorized");

  await db.delete(candidates).where(eq(candidates.id, id));

  revalidatePath("/election/[electionDashboardSlug]/candidate");
}

export async function createPosition(input: CreatePositionSchema) {
  const session = await getSession();

  if (!session) throw new Error("Unauthorized");

  await db.insert(positions).values({
    id: crypto.randomUUID(),
    name: input.name,
    order: input.order,
    min: input.min,
    max: input.max,
    election_id: input.election_id,
  });

  revalidatePath("/election/[electionDashboardSlug]/partylist");
}

export async function deletePosition(id: string) {
  const session = await getSession();

  if (!session) throw new Error("Unauthorized");

  await db.delete(positions).where(eq(positions.id, id));

  revalidatePath("/election/[electionDashboardSlug]/position");
}

export async function editPosition(input: EditPositionSchema) {
  const parsedInput = editPositionSchema.parse(input);

  const session = await getSession();

  if (!session) throw new Error("Unauthorized");

  await db
    .update(positions)
    .set({
      name: parsedInput.name,
      description: parsedInput.description,
      order: parsedInput.order,
      min: parsedInput.min,
      max: parsedInput.max,
    })
    .where(eq(positions.id, parsedInput.id));

  revalidatePath("/election/[electionDashboardSlug]/position");
}

export async function createCandidate(input: CreateCandidateSchema) {
  const session = await getSession();

  if (!session) throw new Error("Unauthorized");

  const isCandidateSlugExists: Candidate | null =
    await db.query.candidates.findFirst({
      where: (candidates, { eq, and }) =>
        and(
          eq(candidates.slug, input.slug),
          eq(candidates.election_id, input.election_id)
        ),
    });

  if (isCandidateSlugExists)
    throw new Error("Candidate slug is already exists");

  await db.insert(candidates).values({
    id: crypto.randomUUID(),
    slug: input.slug,
    first_name: input.first_name,
    middle_name: input.middle_name,
    last_name: input.last_name,
    election_id: input.election_id,
    position_id: input.position_id,
    partylist_id: input.partylist_id,
    image_link: input.image_link,
  });

  revalidatePath("/election/[electionDashboardSlug]/candidate");
}

export async function editCandidate(input: EditCandidateSchema) {
  const session = await getSession();

  if (!session) throw new Error("Unauthorized");

  const isCandidateSlugExists: Candidate | null =
    await db.query.candidates.findFirst({
      where: (candidates, { eq, and }) =>
        and(
          eq(candidates.slug, input.slug),
          eq(candidates.election_id, input.election_id)
        ),
    });

  if (isCandidateSlugExists)
    throw new Error("Candidate slug is already exists");

  await db.insert(candidates).values({
    id: crypto.randomUUID(),
    slug: input.slug,
    first_name: input.first_name,
    middle_name: input.middle_name,
    last_name: input.last_name,
    election_id: input.election_id,
    position_id: input.position_id,
    partylist_id: input.partylist_id,
    image_link: input.image_link,
  });

  revalidatePath("/election/[electionDashboardSlug]/candidate");
}
export async function inviteAllInvitedVoters({
  election_id,
}: {
  election_id: string;
}) {
  const session = await getSession();

  if (!session) throw new Error("Unauthorized");

  const isElectionExists = await db.query.elections.findFirst({
    where: (elections, { eq }) => eq(elections.id, election_id),
    with: {
      commissioners: {
        where: (commissioners, { eq }) => eq(commissioners.user_id, session.id),
      },
    },
  });

  if (!isElectionExists) throw new Error("Election does not exists");

  if (isElectionExists.commissioners.length === 0)
    throw new Error("Unauthorized");

  const invitedVoters = await db.query.invited_voters.findMany({
    where: (invited_voters, { eq }) =>
      eq(invited_voters.election_id, election_id),
  });

  const invitedVotersIds = invitedVoters.map((invitedVoter) => invitedVoter.id);
  console.log(
    "🚀 ~ file: actions.ts:359 ~ invitedVotersIds:",
    invitedVotersIds
  );

  revalidatePath("/election/[electionDashboardSlug]/voter");
}

export async function createVoter(input: CreateVoterSchema) {
  const session = await getSession();

  if (!session) throw new Error("Unauthorized");

  const isVoterExists = await db.query.elections.findFirst({
    where: (elections, { eq }) => eq(elections.id, input.election_id),
    with: {
      commissioners: {
        where: (commissioners, { eq }) => eq(commissioners.user_id, session.id),
      },
    },
  });

  revalidatePath("/election/[electionDashboardSlug]/voter");
}

export async function updateVoterField(input: UpdateVoterFieldSchema) {
  const session = await getSession();

  if (!session) throw new Error("Unauthorized");

  await db
    .update(voter_fields)
    .set(input)
    .where(eq(voter_fields.election_id, input.election_id));

  revalidatePath("/election/[electionDashboardSlug]/voter");
}

export async function deleteSingleVoterField(
  input: DeleteSingleVoterFieldSchema
) {
  const session = await getSession();

  if (!session) throw new Error("Unauthorized");

  await db
    .delete(voter_fields)
    .where(
      and(
        eq(voter_fields.election_id, input.election_id),
        eq(voter_fields.id, input.field_id)
      )
    );

  revalidatePath("/election/[electionDashboardSlug]/voter");
}

export async function editVoter(input: EditVoterSchema) {
  const session = await getSession();

  if (!session) throw new Error("Unauthorized");

  if (input.account_status === "ACCEPTED") {
    const voter: Voter | null = await db.query.voters.findFirst({
      where: (voters, { eq, and }) =>
        and(eq(voters.id, input.id), eq(voters.election_id, input.election_id)),
    });

    if (!voter) throw new Error("Voter not found");
    return {
      type: "voter",
      voter: await db
        .update(voters)
        .set({
          field: input.field,
        })
        .where(eq(voters.id, input.id)),
    };
  } else {
    const invited_voter: InvitedVoter | null =
      await db.query.invited_voters.findFirst({
        where: (invited_voters, { eq, and }) =>
          and(
            eq(invited_voters.id, input.id),
            eq(invited_voters.election_id, input.election_id)
          ),
      });
    if (!invited_voter) throw new Error("Voter not found");

    return {
      type: "invited_voter",
      invitedVoter: await db
        .update(invited_voters)
        .set({
          email: input.email,
          field: input.field,
        })
        .where(
          and(
            eq(invited_voters.id, input.id),
            eq(invited_voters.election_id, input.election_id)
          )
        ),
    };
  }

  revalidatePath("/election/[electionDashboardSlug]/voter");
}

export async function deleteVoter(input: DeleteVoterSchema) {
  const session = await getSession();

  if (!session) throw new Error("Unauthorized");

  if (!input.is_invited_voter) {
    const voter: Voter | null = await db.query.voters.findFirst({
      where: (voters, { eq, and }) =>
        and(eq(voters.id, input.id), eq(voters.election_id, input.election_id)),
    });

    if (!voter) throw new Error("Voter not found");

    await db
      .delete(voters)
      .where(
        and(eq(voters.id, input.id), eq(voters.election_id, input.election_id))
      );
  } else {
    const invited_voter: InvitedVoter | null =
      await db.query.invited_voters.findFirst({
        where: (invited_voters, { eq, and }) =>
          and(
            eq(invited_voters.id, input.id),
            eq(invited_voters.election_id, input.election_id)
          ),
      });

    if (!invited_voter) throw new Error("Voter not found");

    await db
      .delete(invited_voters)
      .where(
        and(
          eq(invited_voters.id, input.id),
          eq(invited_voters.election_id, input.election_id)
        )
      );
  }

  revalidatePath("/election/[electionDashboardSlug]/voter");
}
