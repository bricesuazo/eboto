import { getServerSession } from 'next-auth';
import { getSession } from 'next-auth/react';

export default async function page() {
  const session = await getServerSession();
  console.log('🚀 ~ file: page.tsx:4 ~ page ~ session:', session);
  return <div>page</div>;
}
