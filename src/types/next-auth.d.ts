import { electionType, adminType } from "./typings.d";
import NextAuth from "next-auth";
import { DocumentData } from "firebase/firestore";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: voterType | adminType;
    expires: string;
  }
}
