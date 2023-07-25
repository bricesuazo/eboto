import RootLayoutClient from "@/components/client/layouts/root-layout";
import { currentUser } from "@clerk/nextjs";

export default async function RootLayoutServer({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  return <RootLayoutClient user={user}>{children}</RootLayoutClient>;
}
