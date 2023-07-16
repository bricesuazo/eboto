import { getServerSession } from "next-auth";
import HeaderContent from "@/components/client/components/header";

export default async function Header() {
  const session = await getServerSession();

  return <HeaderContent session={session} />;
}
