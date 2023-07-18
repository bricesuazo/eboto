"use client";

import { type Position } from "@eboto-mo/db/schema";
import { Button } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

export default function EditPosition({ position }: { position: Position }) {
  const [opened, { open, close }] = useDisclosure(false);
  return (
    <>
      <Button onClick={open} variant="light" size="sm" compact>
        Edit
      </Button>
    </>
  );
}
