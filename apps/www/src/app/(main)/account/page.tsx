import { notFound } from "next/navigation";
import AccountPageClient from "@/components/pages/account";
import { api } from "@/trpc/server";
import { createClient } from "@/utils/supabase/server";

export default async function AccountPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  const getUserProtectedQuery =
    await api.auth.getUserProtected.query(undefined);

  return <AccountPageClient {...getUserProtectedQuery} />;
}
