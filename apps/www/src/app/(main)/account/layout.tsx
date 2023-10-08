import AccountPageLayoutClient from "@/components/client/layout/account";

export default function AccountPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AccountPageLayoutClient>{children}</AccountPageLayoutClient>;
}
