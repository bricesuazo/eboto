'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  ActionIcon,
  Alert,
  Box,
  Card,
  Center,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  DrawerRoot,
  Flex,
  HoverCard,
  HoverCardDropdown,
  HoverCardTarget,
  Loader,
  rem,
  Skeleton,
  Stack,
  Text,
  Textarea,
  UnstyledButton,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure, useScrollIntoView } from '@mantine/hooks';
import {
  IconAlertCircle,
  IconAlertTriangle,
  IconChevronLeft,
  IconMessage2,
  IconSend,
  IconX,
} from '@tabler/icons-react';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import moment from 'moment';

import type { Chat as ChatType } from '~/schema/chat';
import { ChatSchema } from '~/schema/chat';
import { api } from '~/trpc/client';

export default function MyMessagesElection({
  election_id,
}: {
  election_id: string;
}) {
  const { scrollIntoView, targetRef, scrollableRef } = useScrollIntoView<
    HTMLDivElement,
    HTMLDivElement
  >({
    duration: 0,
  });
  const [chat, setChat] = useState<{
    id: string;
    name: string;
    title: string;
  } | null>(null);
  const [opened, { close, toggle }] = useDisclosure(false);

  const getAllMyMessagesQuery = api.election.getAllMyMessages.useQuery(
    { election_id },
    { enabled: opened },
  );

  return (
    <>
      <ActionIcon
        variant={!opened ? 'filled' : 'light'}
        radius="xl"
        size={60}
        onClick={toggle}
        style={{
          position: 'fixed',
          bottom: rem(80),
          left: rem(20),
          zIndex: 100,
        }}
      >
        {opened ? <IconX /> : <IconMessage2 />}
      </ActionIcon>
      <DrawerRoot padding={0} opened={opened} onClose={close}>
        <DrawerOverlay />

        <DrawerContent ref={scrollableRef} p="md">
          <DrawerHeader mih="auto" mb="md">
            <DrawerCloseButton />
          </DrawerHeader>
          <DrawerBody>
            {getAllMyMessagesQuery.data === undefined ? (
              <Stack gap="xs" p="md">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} h={60} />
                ))}
              </Stack>
            ) : getAllMyMessagesQuery.data.length === 0 ? (
              <Box>
                <Card>
                  <Center style={{ gap: 8 }}>
                    <IconAlertCircle size={60} stroke={1.5} />
                    <Text size="sm">No messages found.</Text>
                  </Center>
                </Card>
              </Box>
            ) : chat ? (
              <Chat
                chat={chat}
                onBack={() => setChat(null)}
                scrollIntoView={scrollIntoView}
              />
            ) : (
              <Stack>
                <Text ta="center" size="sm">
                  Messages
                </Text>
                <Stack gap="sm">
                  {getAllMyMessagesQuery.data.map((room) => (
                    <UnstyledButton
                      key={room.id}
                      p="md"
                      style={{
                        border: '1px solid #80808050',
                        borderRadius: 8,
                      }}
                      w="100%"
                      onClick={() =>
                        setChat({
                          id: room.id,
                          name: room.messages[0]?.user.name ?? '',
                          title: room.name,
                        })
                      }
                    >
                      <Flex justify="space-between">
                        <Box>
                          <Text
                            lineClamp={1}
                            style={{
                              wordBreak: 'break-all',
                            }}
                          >
                            {room.name}
                          </Text>
                          {room.messages[0] && (
                            <Flex align="center" gap="sm">
                              <Image
                                src={room.messages[0].user.image_url ?? ''}
                                alt={room.messages[0].user.name + ' image.'}
                                width={20}
                                height={20}
                                style={{
                                  borderRadius: '50%',
                                }}
                              />
                              <Text
                                size="sm"
                                lineClamp={1}
                                style={{
                                  wordBreak: 'break-all',
                                }}
                              >
                                {room.messages[0].message}
                              </Text>
                            </Flex>
                          )}
                        </Box>
                        {/* <HoverCard openDelay={500}>
                      <HoverCardTarget>
                        <Text
                          size="xs"
                          c="gray"
                          aria-label={moment(room.created_at).format(
                            "MMMM D, YYYY hh:mm A",
                          )}
                          miw="fit-content"
                        >
                          {moment(room.created_at).fromNow()}
                        </Text>
                      </HoverCardTarget>
                      <HoverCardDropdown>
                        <Text size="xs" c="gray">
                          {moment(room.created_at).format("MMMM D, YYYY hh:mm A")}
                        </Text>
                      </HoverCardDropdown>
                    </HoverCard> */}
                      </Flex>
                    </UnstyledButton>
                  ))}
                </Stack>
              </Stack>
            )}
            <div ref={targetRef} />
          </DrawerBody>
        </DrawerContent>
      </DrawerRoot>
    </>
  );
}

function Chat({
  chat,
  onBack,
  scrollIntoView,
}: {
  chat: {
    id: string;
    name: string;
    title: string;
  };
  onBack: () => void;
  scrollIntoView: () => void;
}) {
  const context = api.useUtils();
  const form = useForm<ChatType>({
    validateInputOnBlur: true,
    initialValues: {
      message: '',
    },

    validate: zod4Resolver(ChatSchema),
  });

  const getMessagesAsVoterQuery = api.election.getMessagesAsVoter.useQuery(
    {
      room_id: chat.id,
    },
    {
      refetchOnMount: true,
    },
  );

  const sendMessageAsVoterMutation =
    api.election.sendMessageAsVoter.useMutation({
      onSuccess: async () => {
        await Promise.allSettled([
          await getMessagesAsVoterQuery.refetch().then(() => form.reset()),
          await context.election.getAllMyMessages.invalidate(),
        ]);
        scrollIntoView();
      },
    });

  useEffect(() => {
    scrollIntoView();
  }, [getMessagesAsVoterQuery.data, scrollIntoView, chat]);

  return (
    <Stack h="100%">
      <Flex
        justify="space-between"
        gap="md"
        // align="center"
        style={{ position: 'sticky', top: 0 }}
      >
        <ActionIcon
          variant="default"
          aria-label="Back"
          size="lg"
          onClick={onBack}
        >
          <IconChevronLeft
            style={{ width: '70%', height: '70%' }}
            stroke={1.5}
          />
        </ActionIcon>

        <Box w="100%">
          <Text ta="center" size="sm">
            {chat.name}
          </Text>
          <Text size="xs" lineClamp={1} ta="center">
            {chat.title}
          </Text>
        </Box>

        <Box h={34} w={34} />
      </Flex>
      <Stack gap="xs">
        {getMessagesAsVoterQuery.isError ? (
          <Center h="100%">
            <Alert
              variant="light"
              color="red"
              title="Error"
              radius="md"
              icon={<IconAlertTriangle />}
            >
              {getMessagesAsVoterQuery.error.message}
            </Alert>
          </Center>
        ) : getMessagesAsVoterQuery.isLoading ||
          !getMessagesAsVoterQuery.data ? (
          <Center h="100%">
            <Loader />
          </Center>
        ) : (
          <Flex direction="column" justify="end" px="md" style={{ flex: 1 }}>
            {getMessagesAsVoterQuery.data.map((message) => (
              <Box
                key={message.id}
                ml={message.user.isMe ? 'auto' : undefined}
                mr={!message.user.isMe ? 'auto' : undefined}
                maw="75%"
              >
                <Box
                  p="xs"
                  style={{
                    border: '1px solid #cccccc25',
                    borderRadius: 8,
                  }}
                >
                  <Text
                    style={{
                      wordBreak: 'break-word',
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
                      w="fit-content"
                      ml={message.user.isMe ? 'auto' : undefined}
                      mb="xs"
                    >
                      {moment(message.created_at).format('hh:mm A')}
                    </Text>
                  </HoverCardTarget>
                  <HoverCardDropdown>
                    <Text size="xs" c="gray">
                      {moment(message.created_at).format(
                        'MMMM D, YYYY hh:mm A',
                      )}
                    </Text>
                  </HoverCardDropdown>
                </HoverCard>
              </Box>
            ))}
          </Flex>
        )}
        <Box
          style={{
            position: 'sticky',
            bottom: 0,
          }}
        >
          <form
            onSubmit={form.onSubmit((values) =>
              sendMessageAsVoterMutation.mutate({
                room_id: chat.id,
                message: values.message,
              }),
            )}
          >
            <Flex align="end" gap="xs">
              <Textarea
                autosize
                placeholder="Type your message here"
                style={{ flex: 1 }}
                maxRows={4}
                {...form.getInputProps('message')}
                error={!!form.errors.message}
                disabled={sendMessageAsVoterMutation.isPending}
              />
              <ActionIcon
                type="submit"
                variant="default"
                aria-label="Send"
                size={42}
                loading={sendMessageAsVoterMutation.isPending}
              >
                <IconSend stroke={1} />
              </ActionIcon>
            </Flex>
          </form>
        </Box>
      </Stack>
    </Stack>
  );
}
