import { electionType } from "./typings.d";
import NextAuth from "next-auth";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      updatedAt: Date;
      accountType: string;
      elections: electionType[];
      email: string;
      emailVerified: boolean;
      uid: string;
      firstName: string;
      createdAt: Date;
      photoUrl: string;
      password: string;
      _id: string;
      lastName: string;
    };
    expires: string;
  }
}
