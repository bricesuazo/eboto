import HeaderContent from "@/components/client/components/header";
import { getSession } from "@/utils/auth";

export default async function Header() {
  const session = await getSession();
  console.log("🚀 ~ file: header.tsx:6 ~ Header ~ session:", session);

  return <HeaderContent session={session} />;
}
