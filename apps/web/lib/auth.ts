import { db } from "@eboto-mo/db";
import { users } from "@eboto-mo/db/schema";
import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  // callbacks: {
  //   async signIn({ account, profile, credentials }) {
  //     if (account?.provider === "google") {
  //       if (!profile || !profile.email) return false;

  //       const user = await db.query.users.findFirst({
  //         where: (users, { eq }) => eq(users.email, profile.email),
  //       });

  //       if (!user) {
  //         let first_name = "";
  //         let last_name = "";

  //         if (!profile.name) return false;
  //         const name_parts: string[] = profile.name.split(" ");

  //         if (name_parts.length === 1) {
  //           first_name = name_parts[0] || "";
  //         } else if (name_parts.length === 2) {
  //           first_name = name_parts[0] || "";
  //           last_name = name_parts[1] || "";
  //         } else if (name_parts.length > 2) {
  //           first_name = name_parts.slice(0, -1).join(" ") || "";
  //           last_name = name_parts[name_parts.length - 1] || "";
  //         }

  //         await db.insert(users).values({
  //           id: crypto.randomUUID(),
  //           email: profile.email,
  //           first_name,
  //           last_name,
  //           image_link: profile.image,
  //           email_verified: new Date(),
  //         });
  //       } else {
  //         if (!user.email_verified) {
  //           await db
  //             .update(users)
  //             .set({
  //               email_verified: new Date(),
  //             })
  //             .where(eq(users.email, profile.email));
  //         }
  //         if (user.image_link !== profile.image) {
  //           await db
  //             .update(users)
  //             .set({
  //               image_link: profile.image,
  //             })
  //             .where(eq(users.email, profile.email));
  //         }
  //       }

  //       return true;
  //     } else if (credentials) {
  //       return true;
  //     }
  //     return false;
  //   },
  //   async session({ session }) {
  //     const user = await db.query.users.findFirst({
  //       where: (users, { eq }) => eq(users.email, session.user.email),
  //     });
  //     if (session.user) {
  //       session.user.id = user.id;
  //       session.user.first_name = user.first_name;
  //       session.user.middle_name = user.middle_name;
  //       session.user.last_name = user.last_name;
  //       session.user.image_link = user.image_link;
  //     }
  //     return session;
  //   },
  //   jwt({ token, session, trigger, user }) {
  //     if (trigger === "update" && session) {
  //       token.id = session.id ?? user.id;
  //       token.firstName = session.firstName;
  //       token.middleName = session.middleName;
  //       token.lastName = session.lastName;
  //       token.image = session.image;
  //     } else if (user) {
  //       token.id = user.id;
  //       token.firstName = user.first_name;
  //       token.middleName = user.middle_name;
  //       token.lastName = user.last_name;
  //       token.image = user.image_link;
  //     }
  //     return token;
  //   },
  // },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    // CredentialsProvider({
    //   name: "Credentials",
    //   credentials: {
    //     email: { label: "Email", type: "email", placeholder: "Email address" },
    //     password: {
    //       label: "Password",
    //       type: "password",
    //       placeholder: "Password",
    //     },
    //   },
    //   async authorize(credentials) {
    //     if (
    //       !credentials ||
    //       !credentials.email.trim() ||
    //       !credentials.password.trim()
    //     ) {
    //       throw new Error("Missing username or password");
    //     }

    //     const user = await db.query.users.findFirst({
    //       where: (users, { eq }) => eq(users.email, credentials.email),
    //     });

    //     if (!user || !user.password) {
    //       throw new Error("Invalid email or password");
    //     }

    //     const isValid = await bcrypt.compare(
    //       credentials.password,
    //       user.password
    //     );

    //     if (!isValid) {
    //       throw new Error("Invalid email or password");
    //     }

    //     if (!user.email_verified || !user.password) {
    //       // await sendEmail({
    //       //   type: "EMAIL_VERIFICATION",
    //       //   email: user.email,
    //       //   userId: user.id,
    //       // });
    //       throw new Error("Email not verified. Email verification sent.");
    //     }

    //     return {
    //       id: user.id,
    //       email: user.email,
    //       first_name: user.first_name,
    //       middle_name: user.middle_name,
    //       last_name: user.last_name,
    //       image_link: user.image_link,
    //     };
    //   },
    // }),
  ],
  // pages: {
  //   signIn: "/signin",
  //   verifyRequest: "/verify",
  // },
};
