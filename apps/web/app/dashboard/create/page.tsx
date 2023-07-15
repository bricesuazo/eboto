import { db } from "@eboto-mo/db";
import { example } from "@eboto-mo/db/schema";

export default async function Page() {
  const insert = await db.insert(example).values({
    id:
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15),
  });
  return <div>{JSON.stringify(insert)}</div>;
}
