"use client";

import { useEffect, useState } from "react";
import GenerateResult from "@/pdf/generate-result";
import { Box, Button, Group, Text } from "@mantine/core";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { IconDownload } from "@tabler/icons-react";
import moment from "moment";

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
          Generated {moment(result.created_at).fromNow()} (
          {moment(result.created_at).format("MMMM DD, YYYY hh:mmA")})
        </Text>
      </Box>

      {isMounted ? (
        <Button
          size="xs"
          leftSection={<IconDownload size="1rem" />}
          component={PDFDownloadLink}
          document={<GenerateResult result={result} />}
          fileName={name}
        >
          Download
        </Button>
      ) : (
        <Button size="xs" leftSection={<IconDownload size="1rem" />} loading>
          Download
        </Button>
      )}
    </Group>
  );
}
