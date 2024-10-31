import { redirect } from "next/navigation";
import { Container } from "@mantine/core";

import { createClient } from "@eboto/supabase/client/server";

export default async function AuthLayout(props: React.PropsWithChildren) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <Container size={420} my={40}>
      {props.children}
    </Container>
  );
}
