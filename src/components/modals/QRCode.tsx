import { Box, Button, Modal, Stack, Text } from "@mantine/core";
import type { Election } from "@prisma/client";
import ReactQRCode from "react-qr-code";

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
        <ReactQRCode
          id="qr-code"
          size={256}
          style={{
            height: "auto",
            maxWidth: "100%",
            width: "100%",
          }}
          value={`https://eboto-mo.com/${election.slug}`}
        />

        <Button
        // onClick={() => {
        //   canvas.getContext("qr-code")?.drawImage(img, 0, 0);
        //   const a = document.createElement("a");
        //   a.download = "my-image.png";
        //   a.href = canvas.toDataURL();
        //   a.click();
        // }}
        >
          Download
        </Button>
      </Stack>
    </Modal>
  );
};

export default QRCode;
