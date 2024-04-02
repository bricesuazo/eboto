"use client";

import { Button, Center, Modal, Stack, Text } from "@mantine/core";
import { IconDownload } from "@tabler/icons-react";
import { QRCodeCanvas } from "qrcode.react";

import type { Database } from "../../../../../supabase/types";

export default function QRCodeModal({
  election,
  opened,
  close,
}: {
  election: Database["public"]["Tables"]["elections"]["Row"];
  opened: boolean;
  close: () => void;
}) {
  return (
    <Modal
      opened={opened}
      onClose={close}
      title={
        <Text fw={600}>Download or scan your QR Code for {election.name}</Text>
      }
    >
      <Stack>
        <Center hiddenFrom="sm">
          <QRCodeCanvas
            id="qr-gen"
            value={`https://eboto.app/${election.slug}`}
            includeMargin
            size={256}
            imageSettings={{
              src: "/images/eboto-pfp.png",
              x: undefined,
              y: undefined,
              height: 54,
              width: 54,
              excavate: true,
            }}
          />
        </Center>
        <Center visibleFrom="sm">
          <QRCodeCanvas
            id="qr-gen"
            value={`https://eboto.app/${election.slug}`}
            includeMargin
            size={408}
            imageSettings={{
              src: "/images/eboto-pfp.png",
              x: undefined,
              y: undefined,
              height: 86,
              width: 86,
              excavate: true,
            }}
          />
        </Center>

        <Button
          onClick={() => {
            const canvas = document.getElementById(
              "qr-gen",
            ) as HTMLCanvasElement | null;

            if (canvas) {
              const pngUrl = canvas
                .toDataURL("image/png")
                .replace("image/png", "image/octet-stream");

              const downloadLink = document.createElement("a");
              downloadLink.href = pngUrl;
              downloadLink.download = `${election.name} (@${election.slug}) - QR Code.png`;

              document.body.appendChild(downloadLink);

              downloadLink.click();

              document.body.removeChild(downloadLink);
            } else {
              console.log("Could not find QR code element");
            }
          }}
          leftSection={<IconDownload size="1rem" />}
        >
          Download
        </Button>
      </Stack>
    </Modal>
  );
}
