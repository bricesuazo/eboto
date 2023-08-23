"use client";

import { UserProfile } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Container, useComputedColorScheme } from "@mantine/core";

export default function AccountPage() {
  const computedColorScheme = useComputedColorScheme("light", {
    getInitialValueInEffect: true,
  });

  return (
    <Container size="md" py="xl" h="100%">
      <UserProfile
        path="/account"
        appearance={{
          baseTheme: computedColorScheme === "dark" ? dark : undefined,

          elements: {
            rootBox: {
              width: "100%",
            },
            card: {
              maxWidth: "100%",
              width: "100%",
              padding: 0,
            },
          },
        }}
      />
    </Container>
  );
}
