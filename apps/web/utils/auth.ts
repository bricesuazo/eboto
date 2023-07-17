import { db } from "@eboto-mo/db";
import { type User } from "@eboto-mo/db/schema";
import { Session, getServerSession } from "next-auth";

export type UserAuth = Session["user"];

export async function getUser(): Promise<User | null> {
  const session = await getServerSession();

  return await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, session.user.id),
  });
}
export async function getSession(): Promise<UserAuth> {
  const session = await getServerSession();
  return session.user;
}
