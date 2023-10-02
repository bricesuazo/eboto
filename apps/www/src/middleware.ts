import { auth } from "@eboto-mo/auth";

export const middleware = auth;

export const config = { matcher: ["/dashboard"] };
