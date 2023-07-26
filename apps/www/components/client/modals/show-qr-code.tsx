"use client";

import type { Election } from "@eboto-mo/db/schema";
import {
  ActionIcon,
  Button,
  Center,
  Modal,
  Stack,
  Text,
  rem,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconDownload, IconQrcode } from "@tabler/icons-react";
import { QRCodeCanvas } from "qrcode.react";

export default function QRCode({ election }: { election: Election }) {
  const [opened, { open, close }] = useDisclosure(false);
  return (
    <>
      <ActionIcon
        onClick={open}
        variant="outline"
        color="#2f9e44"
        size="lg"
        // style={(theme) => ({
        //   [theme.fn.largerThan("md")]: {
        //     display: "none",
        //   },
        // })}
      >
        <IconQrcode />
      </ActionIcon>
      <Button
        onClick={open}
        // style={(theme) => ({
        //   [theme.fn.smallerThan("md")]: {
        //     display: "none",
        //   },
        // })}
        leftSection={<IconQrcode size={rem(18)} />}
      >
        Download/Scan QR Code
      </Button>
      <Modal
        opened={opened}
        onClose={close}
        title={
          <Text fw={600}>
            Download or scan your QR Code for {election.name}
          </Text>
        }
      >
        <Stack>
          <Center visibleFrom="sm">
            <QRCodeCanvas
              id="qr-gen"
              value={`https://eboto-mo.com/${election.slug}`}
              includeMargin
              size={256}
              imageSettings={{
                src: "/images/eboto-mo-pfp.png",
                x: undefined,
                y: undefined,
                height: 54,
                width: 54,
                excavate: true,
              }}
            />
          </Center>
          <Center hiddenFrom="sm">
            <QRCodeCanvas
              id="qr-gen"
              value={`https://eboto-mo.com/${election.slug}`}
              includeMargin
              size={408}
              imageSettings={{
                src: "/images/eboto-mo-pfp.png",
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
    </>
  );
}
