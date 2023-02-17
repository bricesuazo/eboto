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
import sendMail from "../../emails";

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
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    // ...other properties
    // role: UserRole;
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
    // signIn: async ({ user }) => {
    //   if (user && user.email) {
    //     const isUserExists = await prisma.user.findUnique({
    //       where: {
    //         email: user.email,
    //       },
    //     });

    //     if (isUserExists) return false;

    //     if (user.email && user.name && user.image)
    //       await prisma.user.create({
    //         data: {
    //           email: user.email,
    //           emailVerified: new Date(),
    //           first_name: user.name,
    //           last_name: user.name,
    //           image: user.image,
    //           signInWith: "GOOGLE",
    //         },
    //       });
    //   }
    //   return true;
    // },
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        // session.user.role = user.role; <-- put other properties on the session here
      }
      return session;
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
          throw new Error("Invalid password");
        }

        if (!user.emailVerified) {
          const token = await prisma.token.create({
            data: {
              userId: user.id,
              type: "EMAIL_VERIFICATION",
              expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours
            },
            select: {
              id: true,
            },
          });

          await sendMail({
            to: user.email,
            subject: `${user.first_name} ${user.last_name} - Verify your email ${token.id}`,
          });
          throw new Error("Email not verified. Email verification sent.", {
            cause: "EMAIL_NOT_VERIFIED",
          });
        }
        return user;
      },
    }),

    /**
     * ...add more providers here
     *
     * Most other providers require a bit more work than the Discord provider.
     * For example, the GitHub provider requires you to add the
     * `refresh_token_expires_in` field to the Account model. Refer to the
     * NextAuth.js docs for the provider you want to use. Example:
     * @see https://next-auth.js.org/providers/github
     **/
  ],
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
