import { db } from "@eboto-mo/db";

export default async function Page() {
  const test = await db.query.elections.findMany({
    with: {
      positions: true,
    },
  });
  console.log("🚀 ~ file: page.tsx:5 ~ Page ~ test:", test);
  return <div>{JSON.stringify(test)}</div>;
}
