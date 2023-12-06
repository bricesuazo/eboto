import { ActionIcon, Box, Flex, Text } from "@mantine/core";
import { IconChevronLeft } from "@tabler/icons-react";

import type { ChatType } from "../layout/dashboard-election";

export default function Chat({
  chat,
  onBack,
}: {
  chat: ChatType;
  onBack: () => void;
}) {
  return (
    <Box>
      <Flex justify="space-between" gap="md" p="md" align="center">
        <ActionIcon
          variant="default"
          aria-label="Back"
          size="lg"
          onClick={onBack}
        >
          <IconChevronLeft
            style={{ width: "70%", height: "70%" }}
            stroke={1.5}
          />
        </ActionIcon>

        <Box style={{ flex: 1 }}>
          <Text ta="center" size="sm">
            {chat.type === "admin" ? "Admin" : chat.name}
          </Text>
          <Text size="xs" lineClamp={1} ta="center">
            {chat.title}
          </Text>
        </Box>

        <Box w={34} h={34} />
      </Flex>
    </Box>
  );
}
