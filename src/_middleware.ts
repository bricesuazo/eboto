import { withAuth } from "next-auth/middleware";

import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/[electionIdName]/dashboard")) {
    return withAuth({
      callbacks: {
        authorized: ({ token }) => token?.role === "admin",
      },
    }
  }

  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    // This logic is only applied to /dashboard
  }
}