import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      first_name: string;
      middle_name: string | null;
      last_name: string;
      email: string;
      image_link: string | null;
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    image_link: string | null;
    // ...other properties
    // role: UserRole;
  }
}
declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    id: string;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    image_link: string | null;
  }
}
