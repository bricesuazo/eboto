import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      credentials: {
        username: {
          label: "Username",
          placeholder: "username",
          value: "admin",
        },
      },
      async authorize(credentials) {
        const user = { id: "1", name: "User", username: credentials.username };
        return user;
      },
    }),
  ],
};
