import { electionRouter } from "@/server/api/routers/election";
import { db } from "@eboto-mo/db";
import type { Session } from "next-auth";
import { getServerSession } from "next-auth/next";

import { authOptions } from "./auth";

export async function getSession() {
  return await getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getSession();

  if (!session) return null;

  return (
    (await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, session.user.id),
    })) ?? null
  );
}
