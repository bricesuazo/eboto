import { auth } from "@clerk/nextjs";
import { Container } from "@mantine/core";
import { redirect } from "next/navigation";

export default function AuthLayout(props: React.PropsWithChildren) {
  const { userId } = auth();

  if (userId) redirect("/dashboard");

  return (
    <Container size={420} my={40}>
      {props.children}
    </Container>
  );
}
