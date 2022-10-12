import { getDocs } from "firebase/firestore";
import { where } from "firebase/firestore";
import { collection } from "firebase/firestore";
import { query } from "firebase/firestore";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { FirestoreAdapter } from "@next-auth/firebase-adapter";
import { firestore } from "../../../firebase/firebase";

export default NextAuth({
  // Configure one or more authentication providers
  providers: [
    CredentialsProvider({
      credentials: {},
      authorize: async (credentials, req) => {
        const { email, password } = credentials as {
          email: string;
          password: string;
        };
        // Add logic here to look up the user from the credentials supplied

        const adminSnaphot = await getDocs(
          query(collection(firestore, "admins"), where("email", "==", email))
        );
        if (adminSnaphot.docs.length !== 0) {
          const admin = adminSnaphot.docs[0].data();
          if (admin.password === password) {
            return JSON.parse(JSON.stringify(admin));
          } else {
            throw new Error("Invalid password");
          }
        }

        const voterSnaphot = await getDocs(
          query(collection(firestore, "elections"), where("email", "==", email))
        );
        if (voterSnaphot.docs.length !== 0) {
          const voter = adminSnaphot.docs[0].data();
          if (voter.password === password) {
            return JSON.parse(JSON.stringify(voter));
          } else {
            throw new Error("Invalid password");
          }
        }

        if (adminSnaphot.docs.length === 0 && voterSnaphot.docs.length === 0) {
          throw new Error("User not found");
        }
      },
    }),
  ],

  adapter: FirestoreAdapter({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  }),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/signin",
    signOut: "/signout",
    error: "/error", // Error code passed in query string as ?error=
    verifyRequest: "/verify-request", // (used for check email message)
    newUser: "/new-user", // New users will be directed here on first sign in (leave the property out if not of interest)
  },

  callbacks: {
    async session({ session, token, user }) {
      // Send properties to the client, like an access_token from a provider.
      // session.accessToken = token.accessToken;
      return session;
    },
    async jwt({ token, account }) {
      // Persist the OAuth access_token to the token right after signin
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
  },
});
