import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token }) => token?.user.accountType === "admin",
  },
});

export const config = {
  matcher: [
    "/dashboard",
    "/:electionIdName/dashboard",
    "/:electionIdName/dashboard/:path*",
    "/create-election",
  ],
};
