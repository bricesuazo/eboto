import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";

export default function DashboardLayout(props: React.PropsWithChildren) {
  const { userId } = auth();

  if (!userId) redirect("/sign-in?callbackUrl=https://eboto-mo.com/dashboard");
  return <>{props.children}</>;
}
