import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
// import Voters from "../../../models/Voters";
import Admin from "../../../models/Admin";

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const { email, password: credentialPassword } = credentials;
        const admin = await Admin.findOne({ email: email });
        // const voter = await Voters.findOne({ email });
        if (!admin) {
          throw new Error("You haven't registered yet");
        }
        if (admin) return signinUser({ credentialPassword, admin });
      },
    }),
  ],
  pages: {
    signIn: "/signin",
  },

  callbacks: {
    jwt: async ({ token, user }) => {
      user && (token.user = user);
      return token;
    },
    session: async ({ session, token }) => {
      session.user = token.user._doc;
      return session;
    },
  },
});

const signinUser = async ({ credentialPassword, admin }) => {
  const isMatch = await bcrypt.compare(credentialPassword, admin.password);
  if (!isMatch) {
    throw new Error("Password Incorrect.");
  }
  const { password, ...others } = admin;
  return others;
};
