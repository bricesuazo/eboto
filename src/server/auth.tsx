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
      lastName: string;
      email: string;
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
    // async signIn({ credentials }) {
    //   if (credentials && credentials.email) {
    //     const isUserExists = await prisma.user.findUnique({
    //       where: {
    //         email: credentials.email as string,
    //       },
    //     });

    //     if (isUserExists && !isUserExists.emailVerified) {
    //       await SendEmailVerification({
    //         email: isUserExists.email,
    //         userId: isUserExists.id,
    //       });
    //       throw new Error("Email not verified");
    //     }
    //   }
    //   return true;
    // },
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
