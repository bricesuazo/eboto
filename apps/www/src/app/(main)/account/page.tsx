import { notFound } from 'next/navigation';

import AccountPageClient from '~/components/pages/account';
import { createClient } from '~/supabase/server';
import { api } from '~/trpc/server';

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  const getUserProtectedQuery = await api.auth.getUserProtected();

  return <AccountPageClient {...getUserProtectedQuery} />;
}
