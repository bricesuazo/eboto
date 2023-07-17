import HeaderContent from "@/components/client/components/header";
import { getUser } from "@/utils/auth";

export default async function Header() {
  const user = await getUser();

  return <HeaderContent user={user} />;
}
