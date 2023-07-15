import { db } from "@eboto-mo/db";
import { elections } from "@eboto-mo/db/schema";

export default async function Page() {
  await db.insert(elections).values({
    id: "1",
    name: "test",
    slug: "test",
    description: "test",
    start_date: new Date(),
    end_date: new Date(),
  });
  return (
    <div>
      <form action="">
        <input type="text" name="name" id="name" />
        <input type="text" name="slug" id="slug" />
        <input type="text" name="description" id="description" />
        <input type="date" name="start_date" id="start_date" />
      </form>
    </div>
  );
}
