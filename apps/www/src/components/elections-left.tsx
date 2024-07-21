"use client";

import { Badge } from "@mantine/core";

import { api } from "~/trpc/client";

export default function ElectionsLeft() {
  const getElectionsPlusLeftQuery =
    api.election.getElectionsPlusLeft.useQuery();

  if (getElectionsPlusLeftQuery.data === undefined) return null;

  return (
    <Badge
      size="lg"
      variant="dot"
      color={getElectionsPlusLeftQuery.data > 0 ? "green" : "red"}
    >
      {getElectionsPlusLeftQuery.data} Elections Left
    </Badge>
  );
}
