'use client';

import { ActionIcon, Button } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconQrcode } from '@tabler/icons-react';

import QRCodeModal from '~/components/modals/qr-code';
import type { Database } from '../../../../../supabase/types';

export default function ElectionShowQRCode({
  election,
}: {
  election: Database['public']['Tables']['elections']['Row'];
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

      <QRCodeModal election={election} closeAction={close} opened={opened} />
    </>
  );
}
