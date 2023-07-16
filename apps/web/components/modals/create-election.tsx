"use client";

import { Button, Modal } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

export default function CreateElection() {
  const [opened, { open, close }] = useDisclosure(false);
  return (
    <>
      <Modal opened={opened} onClose={close} title="Authentication">
        lol
      </Modal>
      <Button onClick={open}>Create Election</Button>
    </>
  );
}
