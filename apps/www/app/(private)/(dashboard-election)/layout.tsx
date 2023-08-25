import DashboardElection from "@/components/client/layout/dashboard-election";
import { api } from "@/trpc/server";
import { currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";

export default async function DashboardLayout(props: React.PropsWithChildren) {
  const user = await currentUser();

  if (!user)
    return redirect(process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? "/sign-in");

  const elections = await api.election.getAllMyElections.query();

  return (
    <DashboardElection user={user} elections={elections}>
      {props.children}
    </DashboardElection>
  );
}
