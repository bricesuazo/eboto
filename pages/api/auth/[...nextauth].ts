import { db, firebaseConfig } from "./../../../firebase.config";
import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

import { collection, getDocs, query, where } from "firebase/firestore";
import { FirestoreAdapter } from "@next-auth/firebase-adapter";

const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: any) {
        const { email, password } = credentials;
        const querySnapshot = await getDocs(
          query(collection(db, "admins"), where("email", "==", email))
        );

        const user = querySnapshot.docs[0];
        if (!user) {
          console.log("You haven't registered yet");
          throw new Error("You haven't registered yet");
        } else {
          if (password !== user.data().password) {
            console.log("Password Incorrect.");
            throw new Error("Password Incorrect.");
          } else {
            const { password, ...others } = user.data();
            return {
              ...others,
              _id: querySnapshot.docs.map((doc) => doc.id)[0],
            };
          }
        }
      },
    }),
  ],
  secret: process.env.JWT_SECRET,

  pages: { signIn: "/signin" },
  adapter: FirestoreAdapter({
    apiKey: process.env.FIREBASE_API_KEY,
    appId: process.env.FIREBASE_APP_ID,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  }),
  callbacks: {
    jwt: async ({ token, user }) => {
      user && (token.user = user);
      return token;
    },
    session: async ({ session, token }: { session: any; token: any }) => {
      session.user = token.user;
      return session;
    },
  },
};

export default NextAuth(authOptions);
