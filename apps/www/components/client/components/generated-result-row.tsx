"use client";

import type { GeneratedElectionResult } from "@eboto-mo/db/schema";
import { Box, Button, Group, Text } from "@mantine/core";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { IconDownload } from "@tabler/icons-react";
import moment from "moment";
import { useState } from "react";

export default function GenerateResultRow({
  result,
}: {
  result: GeneratedElectionResult;
}) {
  const supabase = createClientComponentClient();
  const [states, setStates] = useState<{
    isGenerating: boolean;
    error: string | null;
  }>({
    isGenerating: false,
    error: null,
  });

  return (
    <Group
      justify="apart"
      align="center"
      style={(theme) => ({
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,

        // "&:hover": {
        //   backgroundColor:
        //     theme.colorScheme === "dark"
        //       ? theme.colors.dark[5]
        //       : theme.colors.gray[2],
        // },
      })}
    >
      <Box>
        <Text>{result.name}</Text>
        <Text size="sm" c="dimmed">
          Generated {moment(result.created_at).fromNow()} (
          {moment(result.created_at).format("MMMM DD, YYYY hh:mmA")})
        </Text>
      </Box>
      <Button
        size="xs"
        leftSection={<IconDownload size="1rem" />}
        loading={states.isGenerating}
        onClick={async () => {
          setStates({
            isGenerating: true,
            error: null,
          });

          await new Promise((resolve) => setTimeout(resolve, 1000));

          const { data, error } = await supabase.storage
            .from("eboto-mo")
            .download(`elections/${result.election_id}/results/${result.name}`);

          if (error) {
            setStates({
              isGenerating: false,
              error: error.message,
            });
            return;
          }

          const url = URL.createObjectURL(data);

          const anchor = document.createElement("a");
          anchor.href = url;
          anchor.download = result.name;

          document.body.appendChild(anchor);

          anchor.click();

          document.body.removeChild(anchor);

          URL.revokeObjectURL(url);

          setStates({
            isGenerating: false,
            error: null,
          });
        }}
      >
        Download
      </Button>
    </Group>
  );
}