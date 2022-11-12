import { JWT } from "next-auth/jwt";
import { electionType, adminType, voterType } from "./typings.d";
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

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    email: string;
    sub: string;
    user: voterType | adminType;
    accessToken: string;
    iat: number;
    exp: number;
    jti: string;
  }
}
