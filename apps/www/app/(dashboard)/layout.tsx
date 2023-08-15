import ElectionDashboard from "@/components/client/layouts/election-dashboard";
import { currentUser } from "@clerk/nextjs";

// TODO: Remove this
//Error: The Edge Function "dashboard/[electionDashboardSlug]/*" size is 1.01 MB and your plan size limit is 1 MB. Learn More: https://vercel.link/edge-function-size
export const runtime = "nodejs";

export default async function DashboardLayout(props: React.PropsWithChildren) {
  const user = await currentUser();
  return (
    <ElectionDashboard user={user} data-superjson>
      {props.children}
    </ElectionDashboard>
  );
}
