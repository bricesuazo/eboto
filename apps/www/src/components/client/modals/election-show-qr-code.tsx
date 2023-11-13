"use client";

import QRCodeModal from "@/components/client/modals/qr-code";
import type { Election } from "@eboto/db/schema";
import { ActionIcon, Button } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconQrcode } from "@tabler/icons-react";

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
