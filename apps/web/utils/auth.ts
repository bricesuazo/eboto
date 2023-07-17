import { authOptions } from "@/lib/auth";
import { db } from "@eboto-mo/db";
import { users, type User } from "@eboto-mo/db/schema";
import { Session, getServerSession } from "next-auth";

export type UserAuth = Session["user"];

export async function getSession(): Promise<UserAuth | null> {
  const session = await getServerSession(authOptions);

  return session ? session.user : null;
}

export async function getUser(): Promise<User | null> {
  const session = await getSession();

  if (!session) {
    return null;
  }

  return (
    (await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, session.id),
    })) ?? null
  );
}
