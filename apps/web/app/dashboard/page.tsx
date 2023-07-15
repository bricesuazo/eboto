import { db } from "@eboto-mo/db";
import { example } from "@eboto-mo/db/schema";

export default async function Page() {
  const test = await db.select().from(example);
  console.log("🚀 ~ file: page.tsx:6 ~ Page ~ test:", test);
  return <div>{JSON.stringify(test)}</div>;
}
