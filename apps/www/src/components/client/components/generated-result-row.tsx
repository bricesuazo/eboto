"use client";

import GenerateResult from "@/pdf/generate-result";
import { Box, Button, Group, Text } from "@mantine/core";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { IconDownload } from "@tabler/icons-react";
import moment from "moment";

import type { GeneratedElectionResult } from "@eboto-mo/db/schema";

export default function GenerateResultRow({
  result,
}: {
  result: GeneratedElectionResult;
}) {
  const nowForName = new Date();
  const name = `${nowForName.getTime().toString()} - ${
    result.election.name
  } (Result) (${nowForName.toDateString()}).pdf`;

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

        // "&:hover": {
        //   backgroundColor:
        //     theme.colorScheme === "dark"
        //       ? theme.colors.dark[5]
        //       : theme.colors.gray[2],
        // },
      })}
    >
      <Box>
        <Text>{name}</Text>
        <Text size="sm" c="dimmed">
          Generated {moment(result.created_at).fromNow()} (
          {moment(result.created_at).format("MMMM DD, YYYY hh:mmA")})
        </Text>
      </Box>

      <Button
        size="xs"
        leftSection={<IconDownload size="1rem" />}
        component={PDFDownloadLink}
        document={<GenerateResult result={result.election} />}
        fileName={name}
      >
        Download
      </Button>
    </Group>
  );
}
