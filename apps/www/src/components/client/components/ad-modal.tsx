"use client";

import { Adsense } from "@ctrl/react-adsense";
import { Modal } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

export default function AdModal() {
  const [opened, { close }] = useDisclosure(true);
  return (
    <Modal
      opened={opened}
      onClose={close}
      title="Ads"
      centered
      closeOnClickOutside={false}
    >
      <Adsense
        style={{
          display: "block",
          width: "100%",
        }}
        client="ca-pub-8443325162715161"
        slot="6949415137"
        format="auto"
        responsive="true"
      />
    </Modal>
  );
}
