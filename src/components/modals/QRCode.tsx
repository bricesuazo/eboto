import { Button, Center, Modal, Stack, Text } from "@mantine/core";
import type { Election } from "@prisma/client";
import { IconDownload } from "@tabler/icons-react";
import { QRCodeCanvas } from "qrcode.react";

const QRCode = ({
  isOpen,
  onClose,
  election,
}: {
  isOpen: boolean;
  onClose: () => void;
  election: Election;
}) => {
  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title={
        <Text weight={600}>
          Download or scan your QR Code for {election.name}
        </Text>
      }
    >
      <Stack>
        <Center
          sx={(theme) => ({
            [theme.fn.largerThan("xs")]: {
              display: "none",
            },
          })}
        >
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
        <Center
          sx={(theme) => ({
            [theme.fn.smallerThan("xs")]: {
              display: "none",
            },
          })}
        >
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
              "qr-gen"
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
          leftIcon={<IconDownload size="1rem" />}
        >
          Download
        </Button>
      </Stack>
    </Modal>
  );
};

export default QRCode;
