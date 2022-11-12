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
    "/:electionIdName/dashboard/overview",
    "/:electionIdName/dashboard/candidate",
    "/:electionIdName/dashboard/partylist",
    "/:electionIdName/dashboard/voter",
    "/:electionIdName/dashboard/settings",
    "/:electionIdName/dashboard/position",
    "/create-election",
  ],
};
