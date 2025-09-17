'use client';

import { useEffect, useState } from 'react';
import type { Route } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from 'next/navigation';
import {
  ActionIcon,
  Alert,
  AppShell,
  AppShellAside,
  AppShellFooter,
  AppShellHeader,
  AppShellMain,
  AppShellNavbar,
  Badge,
  Box,
  Button,
  Card,
  Center,
  CheckIcon,
  Combobox,
  ComboboxChevron,
  ComboboxDropdown,
  ComboboxGroup,
  ComboboxOption,
  ComboboxOptions,
  ComboboxTarget,
  Divider,
  Flex,
  Group,
  HoverCard,
  HoverCardDropdown,
  HoverCardTarget,
  InputBase,
  InputPlaceholder,
  Loader,
  Modal,
  Popover,
  PopoverDropdown,
  PopoverTarget,
  ScrollArea,
  ScrollAreaAutosize,
  Skeleton,
  Stack,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
  Text,
  Textarea,
  TextInput,
  ThemeIcon,
  Tooltip,
  TooltipGroup,
  UnstyledButton,
  useCombobox,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure, useScrollIntoView } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconAlertCircle,
  IconAlertTriangle,
  IconAt,
  IconCheck,
  IconChevronLeft,
  IconExternalLink,
  IconLogout,
  IconMessage2Question,
  IconMessage2X,
  IconPlus,
  IconSend,
  IconUserMinus,
  IconUserPlus,
} from '@tabler/icons-react';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import moment from 'moment';
import Balancer from 'react-wrap-balancer';

import { electionDashboardNavbar, isElectionEnded } from '@eboto/constants';

import Footer from '~/components/footer';
import Header from '~/components/header';
import CreateElection from '~/components/modals/create-election';
import type { Chat, CreateAdminMessage } from '~/schema/chat';
import { ChatSchema, CreateAdminMessageSchema } from '~/schema/chat';
import type { AddCommissioner } from '~/schema/commissioner';
import { AddCommissionerSchema } from '~/schema/commissioner';
import { useStore } from '~/store';
import { api } from '~/trpc/client';
import BoostCard from '../boost-card';

export interface ChatType {
  type: 'admin' | 'voters';
  id: string;
  name: string;
  title: string;
}

export default function DashboardElection({
  children,
  isLoggedIn,
  is_free,
  election_id,
}: React.PropsWithChildren<{
  isLoggedIn?: boolean;
  is_free: boolean;
  election_id: string;
}>) {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('t') ?? 'voters');
  const [chat, setChat] = useState<ChatType | null>(null);

  const pathname = usePathname();

  const [opened, { open, close }] = useDisclosure(false);

  const getAllCommissionerByElectionSlugQuery =
    api.election.getAllCommissionerByElectionSlug.useQuery(
      { election_slug: params.electionDashboardSlug as string },
      {
        enabled: !!params.electionDashboardSlug,
      },
    );
  const getAllCommissionerVoterRoomsQuery =
    api.election.getAllCommissionerVoterRooms.useQuery(
      { election_slug: params.electionDashboardSlug as string },
      {
        enabled: !!params.electionDashboardSlug,
      },
    );
  const addCommissionerMutation = api.election.addCommissioner.useMutation({
    onSuccess: async () => {
      await getAllCommissionerByElectionSlugQuery.refetch();
      form.reset();
    },
  });
  const deleteCommissionerMutation =
    api.election.deleteCommissioner.useMutation({
      onSuccess: async () => {
        await getAllCommissionerByElectionSlugQuery.refetch();
        form.reset();
      },
    });

  const { data: elections } = api.election.getAllMyElections.useQuery();

  const currentElectionUser =
    elections?.find(
      ({ election }) =>
        election.slug === params.electionDashboardSlug?.toString(),
    ) ?? null;

  const currentElection = currentElectionUser?.election;

  const combobox = useCombobox({
    onDropdownOpen: (eventSource) => {
      store.toggleDashboardMenu(true);
      if (eventSource === 'keyboard') {
        combobox.selectActiveOption();
      } else {
        combobox.updateSelectedOptionIndex('active');
      }
    },
  });
  const store = useStore();

  const form = useForm<AddCommissioner>({
    initialValues: {
      email: '',
    },

    validate: zod4Resolver(AddCommissionerSchema),
  });

  useEffect(() => {
    if (opened) {
      form.reset();
      addCommissionerMutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  return (
    <>
      <Modal
        opened={opened}
        onClose={close}
        title={`Commissioners of ${currentElection?.name}`}
        closeOnClickOutside={false}
      >
        <Stack gap="sm">
          {currentElection?.isTheCreator && (
            <form
              onSubmit={form.onSubmit((values) =>
                addCommissionerMutation.mutate({
                  election_id: currentElection.id,
                  email: values.email,
                }),
              )}
            >
              <Flex gap="sm">
                <TextInput
                  placeholder="Email Address"
                  leftSection={<IconAt size="1rem" />}
                  style={{ flex: 1 }}
                  disabled={addCommissionerMutation.isPending}
                  {...form.getInputProps('email')}
                />
                <ActionIcon
                  type="submit"
                  variant="light"
                  size={42}
                  loading={addCommissionerMutation.isPending}
                >
                  <IconUserPlus size="1.5rem" />
                </ActionIcon>
              </Flex>
            </form>
          )}
          {addCommissionerMutation.isError && (
            <Alert
              icon={<IconAlertCircle size="1rem" />}
              title="Error"
              color="red"
            >
              {addCommissionerMutation.error.message}
            </Alert>
          )}
          <Box>
            {getAllCommissionerByElectionSlugQuery.data?.map((commissioner) => (
              <Group key={commissioner.id} p="xs" justify="space-between">
                {!commissioner.user.name ? (
                  <Flex gap="xs">
                    <Text size="sm">{commissioner.user.email}</Text>
                    {commissioner.user.isTheCreator && <Badge>Creator</Badge>}
                  </Flex>
                ) : (
                  <Stack gap={0}>
                    <Flex gap="xs" align="center">
                      <Text size="sm">{commissioner.user.name}</Text>
                      {commissioner.user.isTheCreator && (
                        <Badge size="xs">Creator</Badge>
                      )}
                    </Flex>
                    <Text size="xs">{commissioner.user.email}</Text>
                  </Stack>
                )}

                {!commissioner.user.isTheCreator && (
                  <Popover width={200} position="bottom" withArrow shadow="md">
                    <PopoverTarget>
                      <ActionIcon
                        disabled={deleteCommissionerMutation.isPending}
                        size="lg"
                        radius="xl"
                        variant="light"
                        color="red"
                      >
                        <IconUserMinus size={20} />
                      </ActionIcon>
                    </PopoverTarget>
                    <PopoverDropdown w={240}>
                      <Stack gap="xs">
                        <Text size="sm">
                          Are you sure you want to delete this commissioner?
                        </Text>
                        <Group justify="end">
                          <Button
                            size="compact-sm"
                            variant="light"
                            color="red"
                            onClick={() =>
                              deleteCommissionerMutation.mutate({
                                election_id: currentElection?.id ?? '',
                                commissioner_id: commissioner.id,
                              })
                            }
                            loading={deleteCommissionerMutation.isPending}
                          >
                            Remove
                          </Button>
                        </Group>
                      </Stack>
                    </PopoverDropdown>
                  </Popover>
                )}
              </Group>
            ))}
          </Box>
        </Stack>
      </Modal>
      <AppShell
        header={{ height: 60 }}
        footer={{ height: 52 }}
        navbar={{
          breakpoint: 'xs',
          width: { base: 250, lg: 300 },
          collapsed: {
            desktop: false,
            mobile: !store.dashboardMenu,
          },
        }}
        aside={{
          breakpoint: 'lg',
          width: { md: 280, xl: 320 },
          collapsed: {
            desktop: false,
            mobile: !store.dashboardChatMenu,
          },
        }}
        p="md"
      >
        <AppShellHeader>
          <Header isLoggedIn={isLoggedIn} />
        </AppShellHeader>

        <AppShellMain>{children}</AppShellMain>

        <AppShellNavbar
          p="md"
          style={{
            overflow: 'auto',
          }}
        >
          {/* <ScrollArea p="md" scrollHideDelay={0}> */}
          <Stack justify="space-between">
            <Stack>
              {!is_free ? (
                <CreateElection style={{ width: '100%' }} />
              ) : (
                <BoostCard election_id={election_id} />
              )}

              <Divider />

              <Stack gap="xs">
                <Combobox
                  store={combobox}
                  resetSelectionOnOptionHover
                  onOptionSubmit={(val) => {
                    combobox.toggleDropdown();
                    if (!val) return;

                    if (currentElection?.slug === val) return;

                    router.push(`/dashboard/${val}`);
                    combobox.updateSelectedOptionIndex('active');

                    if (store.dashboardMenu) store.toggleDashboardMenu(false);
                  }}
                >
                  <ComboboxTarget targetType="button">
                    <InputBase
                      component="button"
                      pointer
                      rightSection={<ComboboxChevron />}
                      onClick={() => combobox.toggleDropdown()}
                      disabled={!elections}
                    >
                      {currentElection?.name ? (
                        <Text truncate>{currentElection.name}</Text>
                      ) : (
                        <InputPlaceholder>
                          <Text truncate>Select an election</Text>
                        </InputPlaceholder>
                      )}
                    </InputBase>
                  </ComboboxTarget>

                  <ComboboxDropdown>
                    <ComboboxOptions>
                      <ScrollAreaAutosize mah={200}>
                        {elections &&
                          [
                            {
                              group: 'Ongoing',
                              elections: elections
                                .filter(({ election }) =>
                                  moment().isBetween(
                                    moment(election.start_date).add(
                                      election.voting_hour_start,
                                      'hours',
                                    ),
                                    moment(election.end_date).add(
                                      election.voting_hour_end,
                                      'hours',
                                    ),
                                  ),
                                )
                                .sort(
                                  (a, b) =>
                                    new Date(b.election.updated_at).getTime() -
                                    new Date(a.election.updated_at).getTime(),
                                ),
                            },
                            {
                              group: 'Upcoming',
                              elections: elections
                                .filter(({ election }) =>
                                  moment().isBefore(election.start_date),
                                )
                                .sort(
                                  (a, b) =>
                                    new Date(b.election.updated_at).getTime() -
                                    new Date(a.election.updated_at).getTime(),
                                ),
                            },
                            {
                              group: 'Completed',
                              elections: elections
                                .filter(({ election }) =>
                                  isElectionEnded({ election }),
                                )
                                .sort(
                                  (a, b) =>
                                    new Date(b.election.updated_at).getTime() -
                                    new Date(a.election.updated_at).getTime(),
                                ),
                            },
                          ].map(({ group, elections }) => (
                            <ComboboxGroup key={group} label={group}>
                              {elections.map(({ election }) => (
                                <ComboboxOption
                                  key={election.id}
                                  value={election.slug}
                                  active={
                                    currentElection?.slug === election.slug
                                  }
                                >
                                  <Group gap="xs">
                                    {currentElection?.slug ===
                                      election.slug && <CheckIcon size={12} />}
                                    <span>{election.name}</span>
                                  </Group>
                                </ComboboxOption>
                              ))}
                            </ComboboxGroup>
                          ))}
                      </ScrollAreaAutosize>
                    </ComboboxOptions>
                  </ComboboxDropdown>
                </Combobox>

                <Button
                  variant="outline"
                  w="100%"
                  rightSection={<IconExternalLink size="1rem" />}
                  component={Link}
                  href={{
                    pathname: `/${params.electionDashboardSlug?.toString()}`,
                  }}
                  target="_blank"
                >
                  Visit election
                </Button>
                <Stack gap={4}>
                  {electionDashboardNavbar.map((item) => (
                    <Button
                      key={item.id}
                      component={Link}
                      justify="left"
                      color={
                        item.path === pathname.split('/')[3] ? 'green' : 'gray'
                      }
                      fw="normal"
                      fz="sm"
                      href={{
                        pathname: `/dashboard/${params.electionDashboardSlug?.toString()}/${
                          item.path ?? ''
                        }`,
                      }}
                      onClick={() => {
                        if (store.dashboardMenu)
                          store.toggleDashboardMenu(false);
                      }}
                      variant={
                        item.path === pathname.split('/')[3]
                          ? 'light'
                          : 'subtle'
                      }
                      size="md"
                      leftSection={<item.icon size="1.25rem" />}
                    >
                      {item.label}
                    </Button>
                  ))}
                </Stack>
              </Stack>
            </Stack>

            <Stack gap="xs">
              <Divider />
              <Stack gap="xs" mb={{ xs: 'lg' }}>
                <Group justify="space-between">
                  <Text size="xs" fw={500}>
                    Commissioners
                  </Text>
                  <ActionIcon
                    onClick={open}
                    size="sm"
                    variant="light"
                    radius="xl"
                    aria-label="Add commissioner"
                    disabled={getAllCommissionerByElectionSlugQuery.isLoading}
                  >
                    <IconPlus size={16} />
                  </ActionIcon>
                </Group>
                <TooltipGroup openDelay={300} closeDelay={100}>
                  <Group gap={8}>
                    {getAllCommissionerByElectionSlugQuery.isLoading ? (
                      <ThemeIcon size="lg" variant="default" radius="xl">
                        <Loader size="xs" />
                      </ThemeIcon>
                    ) : (
                      getAllCommissionerByElectionSlugQuery.data?.map(
                        (commissioner) => (
                          <Tooltip
                            key={commissioner.id}
                            label={
                              commissioner.user.name ?? commissioner.user.email
                            }
                            withArrow
                          >
                            {commissioner.user.image_url ? (
                              <ThemeIcon
                                size="lg"
                                variant="default"
                                radius="xl"
                              >
                                <Image
                                  src={commissioner.user.image_url}
                                  alt="Profile picture"
                                  width={24}
                                  height={24}
                                  style={{
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                  }}
                                />
                              </ThemeIcon>
                            ) : (
                              <ThemeIcon
                                size="lg"
                                variant="default"
                                radius="xl"
                              >
                                {commissioner.user.email.slice(0, 2)}
                              </ThemeIcon>
                            )}
                          </Tooltip>
                        ),
                      )
                    )}
                  </Group>
                </TooltipGroup>
              </Stack>
            </Stack>

            <Stack hiddenFrom="xs">
              <Divider />

              <Button
                justify="left"
                color="red"
                fw="normal"
                fz="sm"
                size="md"
                variant="subtle"
                // onClick={() => signOut()}
                leftSection={<IconLogout size="1.25rem" />}
                mb="lg"
              >
                Logout
              </Button>
            </Stack>
          </Stack>
          {/* </ScrollArea> */}
        </AppShellNavbar>

        <AppShellAside
        // style={{
        //   overflow: "auto",
        // }}
        >
          {chat ? (
            <Chat chat={chat} onBack={() => setChat(null)} />
          ) : is_free ? (
            <ScrollArea h="100%" p="md">
              <AdminChat
                election_slug={params.electionDashboardSlug?.toString()}
                setChat={setChat}
              />
            </ScrollArea>
          ) : (
            <Tabs
              value={tab}
              onChange={(value) => {
                setTab(value ?? '');
                router.push(
                  (value === 'voters'
                    ? pathname
                    : `${pathname}?t=admin`) as Route,
                  {
                    scroll: false,
                  },
                );
              }}
              // variant="outline"
              defaultValue="voters"
              h="100%"
            >
              <Stack gap={0} h="100%">
                <TabsList grow h={40}>
                  <TabsTab value="admin">Chat Support</TabsTab>
                  <TabsTab value="voters">Chat from Voters</TabsTab>
                </TabsList>

                <ScrollArea h="100%">
                  <TabsPanel value="admin" p="md">
                    <AdminChat
                      election_slug={params.electionDashboardSlug?.toString()}
                      setChat={setChat}
                    />
                  </TabsPanel>
                  <TabsPanel value="voters" p="md">
                    <Stack gap="xs">
                      {!getAllCommissionerVoterRoomsQuery.data ? (
                        [0, 1, 2, 3, 4, 5].map((i) => (
                          <Skeleton key={i} h={80} />
                        ))
                      ) : getAllCommissionerVoterRoomsQuery.data.length ===
                        0 ? (
                        <Stack gap="xs" justify="center" align="center" p="xl">
                          <IconMessage2X size="3rem" />
                          <Text size="sm" ta="center">
                            No message from voters yet
                          </Text>
                        </Stack>
                      ) : (
                        getAllCommissionerVoterRoomsQuery.data.map((room) => (
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
                                type: 'voters',
                                id: room.id,
                                name: room.messages[0]?.user.name ?? 'Voter',
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
                                      src={
                                        room.messages[0].user.image_url ??
                                        '/images/default-avatar.png'
                                      }
                                      alt={
                                        room.messages[0].user.name + ' image.'
                                      }
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
                              <HoverCard openDelay={500}>
                                <HoverCardTarget>
                                  <Text
                                    size="xs"
                                    c="gray"
                                    aria-label={moment(room.created_at).format(
                                      'MMMM D, YYYY hh:mm A',
                                    )}
                                    miw="fit-content"
                                  >
                                    {moment(room.created_at).fromNow()}
                                  </Text>
                                </HoverCardTarget>
                                <HoverCardDropdown>
                                  <Text size="xs" c="gray">
                                    {moment(room.created_at).format(
                                      'MMMM D, YYYY hh:mm A',
                                    )}
                                  </Text>
                                </HoverCardDropdown>
                              </HoverCard>
                            </Flex>
                          </UnstyledButton>
                        ))
                      )}
                    </Stack>
                  </TabsPanel>
                </ScrollArea>
              </Stack>
            </Tabs>
          )}
        </AppShellAside>

        <AppShellFooter>
          <Footer />
        </AppShellFooter>
      </AppShell>
    </>
  );
}

function CreateAdminMessagePopover({
  election_slug,
}: {
  election_slug: string;
}) {
  const context = api.useUtils();
  const [opened, { close, toggle }] = useDisclosure(false);

  const form = useForm<CreateAdminMessage>({
    validateInputOnChange: true,
    initialValues: {
      title: '',
      message: '',
    },
    validate: zod4Resolver(CreateAdminMessageSchema),
  });

  const messageAdminMutation = api.election.messageAdmin.useMutation({
    onSuccess: async () => {
      await context.election.getAllAdminCommissionerRooms.refetch();
      notifications.show({
        title: 'Message sent!',
        message: 'Successfully sent message to admin',
        icon: <IconCheck size="1.1rem" />,
        autoClose: 5000,
      });
      close();
    },
  });

  useEffect(() => {
    if (opened) {
      form.reset();
      messageAdminMutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);
  return (
    <Popover
      opened={opened || messageAdminMutation.isPending}
      onChange={toggle}
      width={300}
      trapFocus
      position="bottom"
      withArrow
      shadow="md"
    >
      <PopoverTarget>
        <Button
          variant="light"
          size="xs"
          radius="xl"
          leftSection={<IconPlus size="1rem" />}
          onClick={toggle}
        >
          Create message
        </Button>
      </PopoverTarget>
      <PopoverDropdown>
        <form
          onSubmit={form.onSubmit((value) => {
            messageAdminMutation.mutate({
              message: value.message,
              title: value.title,
              election_slug,
            });
          })}
        >
          <Stack gap="sm">
            <TextInput
              label="Title"
              placeholder="Bug found in voting page"
              required
              disabled={messageAdminMutation.isPending}
              {...form.getInputProps('title')}
            />
            <Textarea
              label="Message"
              placeholder="I found a bug in the voting page. When I click the submit button, it doesn't submit my vote."
              autosize
              minRows={4}
              maxRows={6}
              required
              disabled={messageAdminMutation.isPending}
              {...form.getInputProps('message')}
            />
            {messageAdminMutation.isError && (
              <Alert
                icon={<IconAlertCircle size="1rem" />}
                color="red"
                title="Error"
                variant="filled"
              >
                {messageAdminMutation.error.message}
              </Alert>
            )}
            <Flex gap="xs" justify="end">
              <Button
                variant="default"
                size="sm"
                mt="xs"
                onClick={close}
                disabled={messageAdminMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                mt="xs"
                type="submit"
                disabled={!form.isValid()}
                loading={messageAdminMutation.isPending}
              >
                Send
              </Button>
            </Flex>
          </Stack>
        </form>
      </PopoverDropdown>
    </Popover>
  );
}

function Chat({ chat, onBack }: { chat: ChatType; onBack: () => void }) {
  const { scrollIntoView, targetRef, scrollableRef } = useScrollIntoView<
    HTMLDivElement,
    HTMLDivElement
  >({
    duration: 0,
  });
  const context = api.useUtils();
  const form = useForm<Chat>({
    validateInputOnBlur: true,
    initialValues: {
      message: '',
    },

    validate: zod4Resolver(ChatSchema),
  });

  const getMessagesAsComissionerQuery =
    api.election.getMessagesAsComissioner.useQuery(
      {
        type: chat.type,
        room_id: chat.id,
      },
      {
        refetchOnMount: true,
      },
    );

  const sendMessageAsCommissionerMutation =
    api.election.sendMessageAsCommissioner.useMutation({
      onSuccess: async () => {
        await Promise.allSettled([
          getMessagesAsComissionerQuery.refetch().then(() => form.reset()),
          chat.type === 'admin'
            ? context.election.getAllAdminCommissionerRooms.invalidate()
            : context.election.getAllCommissionerVoterRooms.invalidate(),
        ]);
        scrollIntoView();
      },
    });

  useEffect(() => {
    scrollIntoView();
  }, [getMessagesAsComissionerQuery.data, scrollIntoView]);

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
            style={{ width: '70%', height: '70%' }}
            stroke={1.5}
          />
        </ActionIcon>

        <Box style={{ flex: 1 }}>
          <Text ta="center" size="sm">
            {chat.type === 'admin' ? 'Admin' : chat.name}
          </Text>
          <Text size="xs" lineClamp={1} ta="center">
            {chat.title}
          </Text>
        </Box>

        <Box w={34} h={34} />
      </Flex>
      {getMessagesAsComissionerQuery.isError ? (
        <Center h="100%">
          <Alert
            variant="light"
            color="red"
            title="Error"
            radius="md"
            icon={<IconAlertTriangle />}
          >
            {getMessagesAsComissionerQuery.error.message}
          </Alert>
        </Center>
      ) : getMessagesAsComissionerQuery.isLoading ||
        !getMessagesAsComissionerQuery.data ? (
        <Center h="100%">
          <Loader />
        </Center>
      ) : (
        <ScrollArea
          px="md"
          style={{ flex: 1, gap: '0.25rem' }}
          viewportRef={scrollableRef}
        >
          {getMessagesAsComissionerQuery.data.map((message) => (
            <Box
              key={message.id}
              mb="xs"
              ml={message.user.isMe ? 'auto' : undefined}
              mr={!message.user.isMe ? 'auto' : undefined}
              maw={{ base: '75%', xs: '50%', sm: '40%', md: 400, xl: 300 }}
              p="xs"
              style={{
                border: '1px solid #cccccc25',
                borderRadius: 8,
              }}
            >
              <Stack gap={0} mb="xs">
                <Text size="xs" c="gray" lineClamp={4}>
                  {message.user.email}
                </Text>

                <Text size="xs" c="gray" w="fit-content">
                  {moment(message.created_at).format('hh:mm A')}
                </Text>
              </Stack>
              <Text
                style={{
                  wordBreak: 'break-word',
                }}
                size="sm"
              >
                {message.message}
              </Text>
            </Box>
          ))}
          <div ref={targetRef} />
        </ScrollArea>
      )}

      <form
        onSubmit={form.onSubmit((values) =>
          sendMessageAsCommissionerMutation.mutate({
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
            {...form.getInputProps('message')}
            error={!!form.errors.message}
            disabled={sendMessageAsCommissionerMutation.isPending}
          />
          <div>
            <ActionIcon
              type="submit"
              variant="default"
              aria-label="Send"
              size={42}
              loading={sendMessageAsCommissionerMutation.isPending}
            >
              <IconSend stroke={1} />
            </ActionIcon>
          </div>
        </Flex>
      </form>
    </Stack>
  );
}

function AdminChat({
  election_slug,
  setChat,
}: {
  election_slug?: string;
  setChat: React.Dispatch<React.SetStateAction<ChatType | null>>;
}) {
  const getAllAdminCommissionerRoomsQuery =
    api.election.getAllAdminCommissionerRooms.useQuery(
      { election_slug: election_slug ?? '' },
      {
        enabled: !!election_slug,
      },
    );
  return (
    <Stack gap="xs">
      {!getAllAdminCommissionerRoomsQuery.data ? (
        [0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} h={80} />)
      ) : getAllAdminCommissionerRoomsQuery.data.length === 0 ? (
        <Stack gap="xs" justify="center" align="center" p="xl">
          <IconMessage2Question size="3rem" />
          <Balancer>
            <Text size="sm" ta="center">
              Did you find a bug? Feature request? Or just need help? Message us
              here.
            </Text>
          </Balancer>
          <CreateAdminMessagePopover election_slug={election_slug ?? ''} />
        </Stack>
      ) : (
        <>
          <Card padding="lg" radius="md" withBorder>
            <Stack align="center">
              <Balancer>
                <Text size="sm" ta="center">
                  Did you find a bug? Feature request? Or just need help?
                  Message us here.
                </Text>
              </Balancer>
              <CreateAdminMessagePopover election_slug={election_slug ?? ''} />
            </Stack>
          </Card>
          {getAllAdminCommissionerRoomsQuery.data.map((room) => {
            const user = room.messages[0]?.user;
            return (
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
                    type: 'admin',
                    id: room.id,
                    name: user?.name ?? '',
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
                        {user
                          ? user.image_url && (
                              <Image
                                src={user.image_url}
                                alt={user.name + ' image.'}
                                width={20}
                                height={20}
                                style={{
                                  borderRadius: '50%',
                                }}
                              />
                            )
                          : 'Admin'}
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
                  <HoverCard openDelay={500}>
                    <HoverCardTarget>
                      <Text
                        size="xs"
                        c="gray"
                        aria-label={moment(room.created_at).format(
                          'MMMM D, YYYY hh:mm A',
                        )}
                        miw="fit-content"
                      >
                        {moment(room.created_at).fromNow()}
                      </Text>
                    </HoverCardTarget>
                    <HoverCardDropdown>
                      <Text size="xs" c="gray">
                        {moment(room.created_at).format('MMMM D, YYYY hh:mm A')}
                      </Text>
                    </HoverCardDropdown>
                  </HoverCard>
                </Flex>
              </UnstyledButton>
            );
          })}
        </>
      )}
    </Stack>
  );
}
