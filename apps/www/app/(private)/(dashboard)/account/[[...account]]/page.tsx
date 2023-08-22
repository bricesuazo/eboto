"use client";

import { UserProfile } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Container, useComputedColorScheme } from "@mantine/core";

export default function AccountPage() {
  const computedColorScheme = useComputedColorScheme("light", {
    getInitialValueInEffect: true,
  });
  return (
    <Container size="md" py="xl">
      <UserProfile
        path="/account"
        routing="path"
        appearance={{
          baseTheme: computedColorScheme === "dark" ? dark : undefined,
        }}
      />
    </Container>
  );
}
