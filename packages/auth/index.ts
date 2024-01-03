import GoogleProvider from "@auth/core/providers/google";
import type { DefaultSession } from "@auth/core/types";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";

// import EmailProvider from "next-auth/providers/email";

import { db } from "@eboto/db";

import { env } from "./env.mjs";

export type { Session } from "next-auth";

// Update this whenever adding new providers so that the client can
export const providers = ["google", "email"] as const;
export type OAuthProviders = (typeof providers)[number];

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

export const {
  handlers: { GET, POST },
  update,
  auth,
} = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }) as Provider, // TODO: remove this `as`

    // TODO: NodeMailer doesn't work in Edge Runtime for now
    // EmailProvider({
    //   server: {
    //     host: env.SMTP_HOST,
    //     port: env.SMTP_PORT,
    //     auth: {
    //       user: env.SMTP_USER,
    //       pass: env.SMTP_PASSWORD,
    //     },
    //   },
    //   from: env.EMAIL_FROM,
    // }) as unknown as Provider, // TODO: remove this `as`,
  ],
  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
      },
    }),

    // @TODO - if you wanna have auth on the edge
    // jwt: ({ token, profile }) => {
    //   if (profile?.id) {
    //     token.id = profile.id;
    //     token.image = profile.picture;
    //   }
    //   return token;
    // },

    // @TODO
    // authorized({ request, auth }) {
    //   return !!auth?.user
    // }
  },
});
