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
declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    id: string;
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

    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        // session.user.role = user.role; <-- put other properties on the session here
      }
      return session;
    },
  },
  jwt: {
    secret: "super-secret",
    maxAge: 15 * 24 * 30 * 60, // 15 days
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
          name: user.first_name,
          image: user.image,
        };
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
