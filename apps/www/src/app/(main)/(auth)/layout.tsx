import { redirect } from "next/navigation";
import { Container } from "@mantine/core";

import { auth } from "@eboto-mo/auth";

export default async function AuthLayout(props: React.PropsWithChildren) {
  const session = await auth();

  if (session) redirect("/dashboard");

  return (
    <Container size={420} my={40}>
      {props.children}
    </Container>
  );
}
