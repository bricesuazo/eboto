import ElectionDashboard from "@/components/client/layouts/election-dashboard";
import { currentUser } from "@clerk/nextjs";

export const runtime = "edge";

export default async function DashboardLayout(props: React.PropsWithChildren) {
  const user = await currentUser();
  return <ElectionDashboard user={user}>{props.children}</ElectionDashboard>;
}
