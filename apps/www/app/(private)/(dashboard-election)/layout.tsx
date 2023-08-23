import DashboardElection from "@/components/client/layout/dashboard-election";
import { currentUser } from "@clerk/nextjs";

export default async function DashboardLayout(props: React.PropsWithChildren) {
  const user = await currentUser();

  return <DashboardElection user={user}>{props.children}</DashboardElection>;
}
