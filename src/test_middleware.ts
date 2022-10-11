import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyIdToken } from "./firebase/firebase-admin";

export async function middleware(request: NextRequest) {
  console.log(request);
  // const cookies = request.headers.get("authorization");
  // console.log(cookies);
  // const token = await verifyIdToken(cookies?.split("=")[1] as string);
  // console.log(token);
  //   return NextResponse.redirect(new URL("/about-2", request.url));
}
