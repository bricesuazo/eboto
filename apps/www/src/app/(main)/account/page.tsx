import { notFound } from "next/navigation";
import AccountPageClient from "@/components/client/pages/account";

import { auth } from "@eboto/auth";

export default async function AccountPage() {
  const session = await auth();

  if (!session) notFound();

  return <AccountPageClient session={session} />;
}
