"use client";

import { api } from "@/trpc/client";

// import { api } from "@/lib/api/api";

export default function page() {
  return (
    <div>
      <button onClick={() => api.auth.test.mutate()}>asdasdasd</button>
      {/* <p>{api.auth.test.}</p> */}
    </div>
  );
}
