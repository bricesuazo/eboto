
import { auth } from "@eboto-mo/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout(props: React.PropsWithChildren) {
  const session =await auth();

  if (!session)
    return redirect("/sign-in");

  return <>{props.children}</>;
}
