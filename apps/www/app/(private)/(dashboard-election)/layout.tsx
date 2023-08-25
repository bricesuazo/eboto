import DashboardElection from "@/components/client/layout/dashboard-election";
import { api } from "@/trpc/server";
import { currentUser } from "@clerk/nextjs";

export default async function DashboardLayout(props: React.PropsWithChildren) {
  const user = await currentUser();

  const elections = await api.election.getAllMyElections.query();

  return (
    <DashboardElection user={user} elections={elections}>
      {props.children}
    </DashboardElection>
  );
}
