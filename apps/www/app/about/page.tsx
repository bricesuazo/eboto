"use client";

import { api } from "@/lib/api/api";

export default function page() {
  const test = api.auth.test.useMutation();

  return (
    <div>
      <button onClick={() => test.mutate()}>asdasdasd</button>
      <p>{test.data}</p>
    </div>
  );
}
