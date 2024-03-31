import { redirect } from "next/navigation";
import { supabase } from "@/utils/supabase/server";
import { Container } from "@mantine/core";

export default async function AuthLayout(props: React.PropsWithChildren) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) redirect("/dashboard");

  return (
    <Container size={420} my={40}>
      {props.children}
    </Container>
  );
}
