/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { GetServerSidePropsContext } from "next";
import {
  getServerSession,
  type NextAuthOptions,
  type DefaultSession,
} from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./db";
import bcrypt from "bcryptjs";
import { env } from "../env.mjs";
import { sendEmail } from "../utils/sendEmail";

/**
 * Module augmentation for `next-auth` types.
 * Allows us to add custom properties to the `session` object and keep type
 * safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 **/
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      firstName: string;
      middleName: string | null;
      lastName: string;
      email: string;
      image: string | null;
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    firstName: string;
    middleName: string | null;
    lastName: string;
    image: string | null;
    // ...other properties
    // role: UserRole;
  }
}
declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    id: string;
    firstName: string;
    middleName: string | null;
    lastName: string;
    image: string | null;
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks,
 * etc.
 *
 * @see https://next-auth.js.org/configuration/options
 **/
export const authOptions: NextAuthOptions = {
  callbacks: {
    async signIn({ account, profile, credentials }) {
      if (account?.provider === "google") {
        if (!profile || !profile.email) return false;

        const user = await prisma.user.findUnique({
          where: { email: profile.email },
        });

        if (!user) {
          let first_name = "";
          let last_name = "";

          if (!profile.name) return false;
          const name_parts: string[] = profile.name.split(" ");

          if (name_parts.length === 1) {
            first_name = name_parts[0] || "";
          } else if (name_parts.length === 2) {
            first_name = name_parts[0] || "";
            last_name = name_parts[1] || "";
          } else if (name_parts.length > 2) {
            first_name = name_parts[0] || "";
            last_name = name_parts[name_parts.length - 1] || "";
          }

          await prisma.user.create({
            data: {
              email: profile.email,
              first_name,
              last_name,
              image: profile.image,
              emailVerified: new Date(),
            },
          });
        }

        return true;
      } else if (credentials) {
        return true;
      }
      return false;
    },
    async session({ session }) {
      const user = await prisma.user.findUniqueOrThrow({
        where: { email: session.user.email },
      });
      if (session.user) {
        session.user.id = user.id;
        session.user.firstName = user.first_name;
        session.user.middleName = user.middle_name;
        session.user.lastName = user.last_name;
        session.user.image = user.image;
      }
      return session;
    },
    jwt({ token, session, trigger, user }) {
      if (trigger === "update" && session) {
        token.id = session.id ?? user.id;
        token.firstName = session.firstName;
        token.middleName = session.middleName;
        token.lastName = session.lastName;
        token.image = session.image;
      } else if (user) {
        token.id = user.id;
        token.firstName = user.firstName;
        token.middleName = user.middleName;
        token.lastName = user.lastName;
        token.image = user.image;
      }
      return token;
    },
  },

  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (
          !credentials ||
          !credentials.email.trim() ||
          !credentials.password.trim()
        ) {
          throw new Error("Missing username or password");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          throw new Error("Invalid email or password");
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isValid) {
          throw new Error("Invalid email or password");
        }

        if (!user.emailVerified || !user.password) {
          await sendEmail({
            type: "EMAIL_VERIFICATION",
            email: user.email,
            userId: user.id,
          });
          throw new Error("Email not verified. Email verification sent.");
        }

        return {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          middleName: user.middle_name,
          lastName: user.last_name,
          image: user.image,
        };
      },
    }),
  ],
  pages: {
    signIn: "/signin",
    verifyRequest: "/verify",
  },
};

/**
 * Wrapper for `getServerSession` so that you don't need to import the
 * `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 **/
export const getServerAuthSession = (ctx: {
  req: GetServerSidePropsContext["req"];
  res: GetServerSidePropsContext["res"];
}) => {
  return getServerSession(ctx.req, ctx.res, authOptions);
};
