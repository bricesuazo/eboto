import HeaderContent from "@/components/client/components/header";
import { currentUser } from "@clerk/nextjs";

export default async function Header() {
  const user = await currentUser();

  return <HeaderContent user={user} data-superjson />;
}
