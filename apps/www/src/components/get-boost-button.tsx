"use client";

import Link from "next/link";
import { Button } from "@mantine/core";
import { IconMail, IconRocket } from "@tabler/icons-react";

import { useStore } from "~/store";
import { api } from "~/trpc/client";

export function GetBoostButton({ value }: { value: number }) {
  const userQuery = api.auth.getUser.useQuery();
  const store = useStore();

  return value === 100 ? (
    <Button
      size="lg"
      radius="xl"
      variant="gradient"
      w="100%"
      component={Link}
      href="/contact"
      rightSection={<IconMail />}
    >
      Contact Us
    </Button>
  ) : userQuery.data ? (
    <Button
      size="lg"
      radius="xl"
      variant="gradient"
      w="100%"
      rightSection={<IconRocket />}
      onClick={() => store.toggleElectionBoost(true)}
    >
      Get Boost
    </Button>
  ) : (
    <Button
      size="lg"
      radius="xl"
      variant="gradient"
      w="100%"
      disabled={userQuery.isLoading}
      component={Link}
      href="/sign-in"
      rightSection={<IconRocket />}
    >
      Get Boost
    </Button>
  );
}
