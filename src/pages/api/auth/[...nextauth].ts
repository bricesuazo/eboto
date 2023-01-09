import {
  query,
  collection,
  where,
  getDocs,
  getDoc,
  doc,
} from "firebase/firestore";
import NextAuth, { Session, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { FirestoreAdapter } from "@next-auth/firebase-adapter";
import { firestore } from "../../../firebase/firebase";
import { JWT } from "next-auth/jwt";
import { electionType, voterType } from "../../../types/typings";
import bcrypt from "bcryptjs";

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
        // for admin query
        const adminSnaphot = await getDocs(
          query(collection(firestore, "admins"), where("email", "==", email))
        );
        if (adminSnaphot.docs.length !== 0) {
          const admin = adminSnaphot.docs[0].data();
          if (bcrypt.compareSync(password, admin.password)) {
            return JSON.parse(JSON.stringify(admin));
          } else {
            return Promise.reject(new Error("Invalid password"));
            // return new Error("Invalid password");
          }
        }

        // for voter query
        const elections: electionType[] = [];
        await getDocs(collection(firestore, "elections")).then(
          (querySnapshot) => {
            querySnapshot.forEach(async (doc) => {
              elections.push(doc.data() as electionType);
            });
          }
        );
        const voters: voterType[] = [];
        await Promise.all(
          elections.map(async (election) => {
            await getDocs(
              query(
                collection(firestore, "elections", election.uid, "voters"),
                where("email", "==", email)
              )
            ).then((querySnapshot) => {
              querySnapshot.forEach((doc) => {
                voters.push(doc.data() as voterType);
              });
            });
          })
        );

        if (voters.length > 0) {
          const voter = voters.filter(
            (voter) => voter.password === password
          )[0];
          if (!voter) {
            return Promise.reject(new Error("Invalid credentials"));

            throw new Error("Invalid credentials");
          }
          return voter;
        }

        if (adminSnaphot.docs.length === 0 && voters.length === 0) {
          return Promise.reject(new Error("No user found"));
          throw new Error("No user found");
        }
      },
    }),
  ],

  callbacks: {
    async session({ session, token }: { session: Session; token: JWT }) {
      session.user = token.user as Session["user"];

      if (session.user.accountType === "admin") {
        const updatedAdminData = await getDoc(
          doc(firestore, "admins", session.user.uid)
        );
        if (updatedAdminData.exists()) {
          session.user = updatedAdminData.data() as Session["user"];
          token.user = updatedAdminData.data() as Session["user"];
        }
      } else if (session.user.accountType === "voter") {
        const updatedVoterData = await getDoc(
          doc(
            firestore,
            "elections",
            session.user.election,
            "voters",
            session.user.uid
          )
        );
        if (updatedVoterData.exists()) {
          session.user = updatedVoterData.data() as Session["user"];
          token.user = updatedVoterData.data() as Session["user"];
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        const { password, ...userWithoutPassword } = JSON.parse(
          JSON.stringify(user)
        );
        token.accessToken = user.id;
        token.user = userWithoutPassword;
      }
      return token;
    },
  },

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
    // error: "/error", // Error code passed in query string as ?error=
    verifyRequest: "/verify-request", // (used for check email message)
    newUser: "/new-user", // New users will be directed here on first sign in (leave the property out if not of interest)
  },
});
