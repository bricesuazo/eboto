import { api } from "@/trpc/client";
import {
  ActionIcon,
  Alert,
  Box,
  Center,
  Flex,
  HoverCard,
  HoverCardDropdown,
  HoverCardTarget,
  Loader,
  Stack,
  Text,
  Textarea,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import {
  IconAlertTriangle,
  IconChevronLeft,
  IconSend,
} from "@tabler/icons-react";
import { zodResolver } from "mantine-form-zod-resolver";
import moment from "moment";
import { z } from "zod";

import type { ChatType } from "../layout/dashboard-election";

export default function Chat({
  chat,
  onBack,
}: {
  chat: ChatType;
  onBack: () => void;
}) {
  const form = useForm({
    validateInputOnBlur: true,
    initialValues: {
      message: "",
    },

    validate: zodResolver(
      z.object({
        message: z.string().min(3, "Message must be at least 3 characters"),
      }),
    ),
  });

  const getMessagesQuery = api.election.getMessages.useQuery(
    {
      type: chat.type,
      room_id: chat.id,
    },
    {
      refetchOnMount: true,
    },
  );

  const sendMessageMutation = api.election.sendMessage.useMutation({
    onSuccess: async () => {
      await getMessagesQuery.refetch();
      form.reset();
    },
  });

  return (
    <Stack h="100%" gap={0}>
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

      <Stack gap="xs" justify="flex-end" style={{ flex: 1 }} px="md">
        {getMessagesQuery.isError ? (
          <Center h="100%">
            <Alert
              variant="light"
              color="red"
              title="Error"
              radius="md"
              icon={<IconAlertTriangle />}
            >
              {getMessagesQuery.error.message}
            </Alert>
          </Center>
        ) : getMessagesQuery.isLoading || !getMessagesQuery.data ? (
          <Center h="100%">
            <Loader />
          </Center>
        ) : (
          <Box>
            {getMessagesQuery.data.map((message) => (
              <Box
                key={message.id}
                ml={message.user.isMe ? "auto" : undefined}
                mr={!message.user.isMe ? "auto" : undefined}
                maw={{ base: "75%", xs: "50%", sm: "40%", md: 200, xl: 300 }}
              >
                <Box
                  p="xs"
                  style={{
                    border: "1px solid #cccccc25",
                    borderRadius: 8,
                  }}
                >
                  <Text
                    style={{
                      wordWrap: "break-word",
                    }}
                  >
                    {message.message}
                  </Text>
                </Box>
                <HoverCard openDelay={500}>
                  <HoverCardTarget>
                    <Text
                      size="xs"
                      c="gray"
                      ta={message.user.isMe ? "right" : undefined}
                    >
                      {moment(message.created_at).format("hh:mm A")}
                    </Text>
                  </HoverCardTarget>
                  <HoverCardDropdown>
                    <Text size="xs" c="gray">
                      {moment(message.created_at).format(
                        "MMMM D, YYYY hh:mm A",
                      )}
                    </Text>
                  </HoverCardDropdown>
                </HoverCard>
              </Box>
            ))}
          </Box>
        )}
      </Stack>

      <form
        onSubmit={form.onSubmit((values) =>
          sendMessageMutation.mutate({
            type: chat.type,
            room_id: chat.id,
            message: values.message,
          }),
        )}
      >
        <Flex align="end" p="md" gap="xs">
          <Textarea
            autosize
            placeholder="Type your message here"
            style={{ flex: 1 }}
            maxRows={4}
            {...form.getInputProps("message")}
            error={!!form.errors.message}
            disabled={sendMessageMutation.isPending}
          />
          <ActionIcon
            type="submit"
            variant="default"
            aria-label="Send"
            size={36}
            loading={sendMessageMutation.isPending}
          >
            <IconSend stroke={1} />
          </ActionIcon>
        </Flex>
      </form>
    </Stack>
  );
}
