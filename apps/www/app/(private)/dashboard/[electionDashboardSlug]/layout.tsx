import DashboardElection from "@/components/client/layout/dashboard-election";
import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";

export default function DashboardLayout(props: React.PropsWithChildren) {
  const { userId } = auth();

  if (!userId)
    return redirect(process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? "/sign-in");

  return (
    <DashboardElection userId={userId}>{props.children}</DashboardElection>
  );
}