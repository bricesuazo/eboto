import DashboardElection from "@/components/client/layout/dashboard-election";
import { api } from "@/trpc/server";
import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";

export default async function DashboardLayout(props: React.PropsWithChildren) {
  const { userId } = auth();

  if (!userId)
    return redirect(process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? "/sign-in");

  const elections = await api.election.getAllMyElections.query();

  return (
    <DashboardElection
      userId={userId}
      elections={elections.map(({ election }) => election)}
    >
      {props.children}
    </DashboardElection>
  );
}
