import { db } from "@eboto-mo/db";
import { example } from "@eboto-mo/db/schema";

export default async function Page() {
  // await db.insert(example).values({
  //   id:
  //     Math.random().toString(36).substring(2, 15) +
  //     Math.random().toString(36).substring(2, 15),
  // });
  return <div>page</div>;
}
