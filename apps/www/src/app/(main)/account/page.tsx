import { notFound } from "next/navigation";
import AccountPageClient from "@/components/pages/account";
import { api } from "@/trpc/server";
import { supabase } from "@/utils/supabase/server";

export default async function AccountPage() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) notFound();

  const getSessionProtectedQuery =
    await api.auth.getSessionProtected.query(undefined);

  return <AccountPageClient {...getSessionProtectedQuery} />;
}
