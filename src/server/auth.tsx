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
import SendEmailVerification from "../libs/SendEmailVerification";

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
      lastName: string;
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    firstName: string;
    lastName: string;
    // ...other properties
    // role: UserRole;
  }
}
declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    id: string;
    firstName: string;
    lastName: string;
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
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        const isUserExists = await prisma.user.findUnique({
          where: {
            email: user.email,
          },
        });

        if (!isUserExists) {
          if (user.email && user.name && user.image) {
            const newUser = await prisma.user.create({
              data: {
                email: user.email,
                emailVerified: new Date(),
                first_name:
                  // profile?.given_name ||
                  user.name.split(" ").slice(0, -1).join(" "),
                last_name:
                  // profile?.family_name ||
                  user.name.split(" ").slice(-1).join(" "),
                image: user.image,
                provider: "GOOGLE",
              },
              select: {
                id: true,
                first_name: true,
                last_name: true,
              },
            });
            user.id = newUser.id;
            user.firstName = newUser.first_name;
            user.lastName = newUser.last_name;
          }
        } else {
          user.id = isUserExists.id;
          user.firstName = isUserExists.first_name;
          user.lastName = isUserExists.last_name;
        }
      }
      return true;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.firstName = token.firstName;
        session.user.lastName = token.lastName;
        // session.user.role = user.role; <-- put other properties on the session here
      }
      return session;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        // token.role = user.role; <-- put other properties on the token here
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

        const tempUser = await prisma.temporaryUser.findUnique({
          where: { email: credentials.email },
        });
        if (tempUser && tempUser.password) {
          const istempUserPasswordValid = await bcrypt.compare(
            credentials.password,
            tempUser.password
          );

          if (!istempUserPasswordValid) {
            throw new Error("Invalid password");
          } else {
            await SendEmailVerification({
              email: tempUser.email,
              userId: tempUser.id,
            });
            throw new Error("Email not verified. Email verification sent.");
          }
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
          throw new Error("Invalid password");
        }

        if (!user.emailVerified) {
          await SendEmailVerification({
            email: user.email,
            userId: user.id,
          });

          throw new Error("Email not verified. Email verification sent.", {
            cause: "EMAIL_NOT_VERIFIED",
          });
        }

        return {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
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
