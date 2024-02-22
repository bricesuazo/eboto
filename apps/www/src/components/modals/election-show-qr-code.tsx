"use client";

import QRCodeModal from "@/components/modals/qr-code";
import { ActionIcon, Button } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconQrcode } from "@tabler/icons-react";

import type { Election } from "@eboto/db/schema";

export default function ElectionShowQRCode({
  election,
}: {
  election: Election;
}) {
  const [opened, { open, close }] = useDisclosure(false);
  return (
    <>
      <ActionIcon
        onClick={open}
        variant="outline"
        color="#2f9e44"
        size="xl"
        radius="xl"
        hiddenFrom="md"
      >
        <IconQrcode />
      </ActionIcon>
      <Button
        onClick={open}
        size="md"
        radius="xl"
        variant="outline"
        visibleFrom="md"
        leftSection={<IconQrcode />}
      >
        QR Code
      </Button>

      <QRCodeModal election={election} close={close} opened={opened} />
    </>
  );
}
