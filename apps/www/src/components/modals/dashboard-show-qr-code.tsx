'use client';

import { ActionIcon, Button } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconQrcode } from '@tabler/icons-react';

import QRCodeModal from '~/components/modals/qr-code';
import type { Database } from '../../../../../supabase/types';

export default function DashboardShowQRCode({
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
        size="lg"
        hiddenFrom="md"
      >
        <IconQrcode />
      </ActionIcon>
      <Button onClick={open} visibleFrom="md" leftSection={<IconQrcode />}>
        Download/Scan QR Code
      </Button>

      <QRCodeModal election={election} closeAction={close} opened={opened} />
    </>
  );
}
