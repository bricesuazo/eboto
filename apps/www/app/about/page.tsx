"use client";

import { api_client } from "@/shared/client/trpc";
import { getServerSession } from "next-auth";
import { getSession } from "next-auth/react";

export default function page() {
  const session = api_client.auth.test.useMutation();
  console.log("🚀 ~ file: page.tsx:9 ~ page ~ session:", session.data);

  return (
    <div>
      <button onClick={() => session.mutate()}>asdasdasd</button>
      <p>{session.data}</p>
    </div>
  );
}
