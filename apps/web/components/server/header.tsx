import { getServerSession } from "next-auth";
import HeaderContent from "@/components/client/components/header";

export default async function Header() {
  const session = await getServerSession();
  console.log("🚀 ~ file: header.tsx:6 ~ Header ~ session:", session);

  return <HeaderContent session={session} />;
}
