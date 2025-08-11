import AccountPageLayoutClient from '~/components/layout/account';

export default function AccountPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AccountPageLayoutClient>{children}</AccountPageLayoutClient>;
}
