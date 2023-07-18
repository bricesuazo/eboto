"use client";

import { type Position } from "@eboto-mo/db/schema";
import { Button } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

export default function DeletePosition({ position }: { position: Position }) {
  const [opened, { open, close }] = useDisclosure(false);
  return (
    <>
      <Button onClick={open} variant="light" color="red" size="sm" compact>
        Delete
      </Button>
    </>
  );
}
