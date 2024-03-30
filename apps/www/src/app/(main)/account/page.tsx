import { notFound } from "next/navigation";
import AccountPageClient from "@/components/pages/account";
import { createClient } from "@/utils/supabase/server";

export default async function AccountPage() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) notFound();

  return <AccountPageClient session={session} />;
}
