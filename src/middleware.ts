import { withAuth } from "next-auth/middleware";

// import type { NextRequest, NextResponse } from "next/server";

// export function middleware(req: NextRequest, res: NextResponse) {
//   if (req.nextUrl.pathname.startsWith("/[electionIdName]/dashboard/:path*")) {
//     console.log("lol");
//     return withAuth({
//       callbacks: {
//         authorized: ({ token }) => token?.accountType === "admin",
//       },
//     });
//   }
//   // if (req.nextUrl.pathname.startsWith("/dashboard")) {
//   //   // This logic is only applied to /dashboard
//   // }
// }

export default withAuth();
// `withAuth` augments your `Request` with the user's token.

//   {
//     callbacks: {
//       authorized: ({ token }) => token?.user.accountType === "admin",
//     },
//   }

export const config = {
  matcher: ["/dashboard", "/:path*/dashboard", "/:path*/dashboard/:path*"],
};
