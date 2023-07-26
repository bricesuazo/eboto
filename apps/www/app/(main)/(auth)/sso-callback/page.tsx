"use client";

import { useClerk } from "@clerk/nextjs";
import type { HandleOAuthCallbackParams } from "@clerk/types";
import { Center, Loader } from "@mantine/core";
import { useEffect } from "react";

export const runtime = "edge";

export default function SSOCallback(props: {
  searchParams: HandleOAuthCallbackParams;
}) {
  const { handleRedirectCallback } = useClerk();

  useEffect(() => {
    void handleRedirectCallback(props.searchParams);
  }, [props.searchParams, handleRedirectCallback]);

  return (
    <Center>
      <Loader />
    </Center>
  );
}
