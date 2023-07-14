import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "eBoto Mo | Dashboard",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
