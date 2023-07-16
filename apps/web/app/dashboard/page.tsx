import CreateElection from "@/components/modals/create-election";
import { db } from "@eboto-mo/db";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await getServerSession();

  if (!session.user.image) redirect("/");

  const electionCommissioner = await db.query.commissioners.findMany({
    where: (commissioners, { eq }) =>
      eq(commissioners.user_id, session.user.image),
    with: {
      election: true,
    },
  });
  return (
    <div>
      <CreateElection />
    </div>
  );
}
