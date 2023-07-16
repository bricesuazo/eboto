"use server";

import { cookies } from "next/headers";

export async function toggleTheme() {
  cookies().get("theme") && cookies().get("theme").value === "dark"
    ? cookies().set("theme", "light")
    : cookies().set("theme", "dark");
}
