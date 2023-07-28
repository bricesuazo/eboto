import ElectionDashboard from "@/components/client/layouts/election-dashboard";
import { currentUser } from "@clerk/nextjs";

export default async function DashboardLayout(props: React.PropsWithChildren) {
  const user = await currentUser();
  return (
    <ElectionDashboard user={user} data-superjson>
      {props.children}
    </ElectionDashboard>
  );
}
