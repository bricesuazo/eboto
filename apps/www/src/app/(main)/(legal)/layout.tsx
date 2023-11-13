import { Container } from "@mantine/core";

export const dynamic = "force-static";

export default function LegalPagesLayout({
  children,
}: React.PropsWithChildren) {
  return <Container>{children}</Container>;
}
