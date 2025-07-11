"use client";

import { useEffect, useState } from "react";
// TODO: Change this import once @react-pdf/renderer is updated to support React 19
// import { PDFDownloadLink } from "@react-pdf/renderer";
// import { PDFDownloadLink } from "@alexandernanberg/react-pdf-renderer";
import { Box, Button, Group, Text } from "@mantine/core";
import { IconDownload } from "@tabler/icons-react";
import { DateUtils } from "~/utils/date";

import { PDFDownloadLinkLazy, GenerateResultLazy } from "~/components/pdf-lazy";
import type { GeneratedElectionResult } from "../../../../supabase/custom-types";

export default function GenerateResultRow({
  result,
}: {
  result: GeneratedElectionResult;
}) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const name = `${new Date(result.created_at).getTime().toString()} - ${
    result.election.name
  } (Result) (${new Date(result.created_at).toDateString()}).pdf`;

  return (
    <Group
      justify="space-between"
      align="center"
      style={(theme) => ({
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,

        borderWidth: 2,
        borderStyle: "solid",
        borderColor: "var(--mantine-color-green-light-hover)",
      })}
    >
      <Box>
        <Text>{name}</Text>
        <Text size="sm" c="dimmed">
          Generated {DateUtils.fromNow(result.created_at)} (
          {DateUtils.formatDateTimeShort(result.created_at)})
        </Text>
      </Box>

      {isMounted ? (
        <PDFDownloadLinkLazy
          document={<GenerateResultLazy result={result} />}
          fileName={name}
        >
          <Button leftSection={<IconDownload size={16} />} size="xs">
            Download PDF
          </Button>
        </PDFDownloadLinkLazy>
      ) : (
        <Button size="xs" leftSection={<IconDownload size="1rem" />} loading>
          Download
        </Button>
      )}
    </Group>
  );
}
