"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import Footer from "@/components/client/components/footer";
import Header from "@/components/client/components/header";
import CreateElection from "@/components/client/modals/create-election";
import { useStore } from "@/store";
import { api } from "@/trpc/client";
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
  InputBase,
  InputPlaceholder,
  Loader,
  Modal,
  Popover,
  PopoverDropdown,
  PopoverTarget,
  ScrollAreaAutosize,
  Stack,
  Tabs,
  TabsList,
  TabsPanel,
  Text,
  TextInput,
  ThemeIcon,
  Tooltip,
  TooltipGroup,
  useCombobox,
} from "@mantine/core";
import { isEmail, useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import {
  IconAlertCircle,
  IconAt,
  IconExternalLink,
  IconLogout,
  IconPlus,
  IconUserMinus,
  IconUserPlus,
} from "@tabler/icons-react";

import {
  electionDashboardNavbar,
  isElectionEnded,
  isElectionOngoing,
} from "@eboto/constants";

import BoostCard from "../components/boost-card";

export default function DashboardElection({
  children,
  userId,
}: React.PropsWithChildren<{
  userId?: string;
}>) {
  const router = useRouter();
  const params = useParams();

  const pathname = usePathname();

  const [opened, { open, close }] = useDisclosure(false);

  const getAllCommissionerByElectionSlugQuery =
    api.election.getAllCommissionerByElectionSlug.useQuery(
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

  const currentElectionUser = elections
    ? elections.find(
        ({ election }) =>
          election.slug === params?.electionDashboardSlug?.toString(),
      )
    : null;

  const currentElection = currentElectionUser?.election;

  const combobox = useCombobox({
    onDropdownOpen: (eventSource) => {
      store.toggleDashboardMenu(true);
      if (eventSource === "keyboard") {
        combobox.selectActiveOption();
      } else {
        combobox.updateSelectedOptionIndex("active");
      }
    },
  });
  const store = useStore();

  const isBoosted = false;

  const form = useForm({
    initialValues: {
      email: "",
    },

    validate: {
      email: isEmail("Invalid email address"),
    },
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
                  placeholder="bricesuazo@gmail.com"
                  leftSection={<IconAt size="1rem" />}
                  style={{ flex: 1 }}
                  disabled={addCommissionerMutation.isPending}
                  {...form.getInputProps("email")}
                />
                <ActionIcon
                  type="submit"
                  variant="light"
                  size={36}
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
                  <Flex>
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
                                election_id: currentElection?.id ?? "",
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
          breakpoint: "xs",
          width: { base: 250, sm: 300 },
          collapsed: {
            desktop: false,
            mobile: !store.dashboardMenu,
          },
        }}
        aside={{
          breakpoint: "lg",
          width: { lg: 300, xl: 400 },
          collapsed: {
            desktop: false,
            mobile: !store.dashboardChatMenu,
          },
        }}
        p="md"
      >
        <AppShellHeader>
          <Header userId={userId} />
        </AppShellHeader>

        <AppShellMain>{children}</AppShellMain>

        <AppShellNavbar
          p="md"
          style={{
            overflow: "auto",
          }}
        >
          {/* <ScrollArea p="md" scrollHideDelay={0}> */}
          <Stack justify="space-between">
            <Stack>
              {isBoosted ? (
                <CreateElection style={{ width: "100%" }} />
              ) : (
                <BoostCard />
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
                    combobox.updateSelectedOptionIndex("active");

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
                        <Text truncate size="sm">
                          {currentElection?.name}
                        </Text>
                      ) : (
                        <InputPlaceholder>
                          <Text truncate size="sm">
                            Select an election
                          </Text>
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
                              group: "Ongoing",
                              elections: elections
                                .filter(
                                  ({ election }) =>
                                    isElectionOngoing({ election }) &&
                                    !isElectionEnded({ election }),
                                )
                                .sort(
                                  (a, b) =>
                                    b.election.updated_at.getTime() -
                                    a.election.updated_at.getTime(),
                                ),
                            },
                            {
                              group: "Upcoming",
                              elections: elections
                                .filter(
                                  ({ election }) =>
                                    election.start_date > new Date(),
                                )
                                .sort(
                                  (a, b) =>
                                    b.election.updated_at.getTime() -
                                    a.election.updated_at.getTime(),
                                ),
                            },
                            {
                              group: "Completed",
                              elections: elections
                                .filter(({ election }) =>
                                  isElectionEnded({ election }),
                                )
                                .sort(
                                  (a, b) =>
                                    b.election.updated_at.getTime() -
                                    a.election.updated_at.getTime(),
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
                  href={`/${params?.electionDashboardSlug?.toString()}`}
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
                        item.path === pathname?.split("/")[3] ? "green" : "gray"
                      }
                      fw="normal"
                      fz="sm"
                      href={`/dashboard/${params?.electionDashboardSlug?.toString()}/${
                        item.path ?? ""
                      }`}
                      onClick={() => {
                        store.dashboardMenu && store.toggleDashboardMenu(false);
                      }}
                      variant={
                        item.path === pathname?.split("/")[3]
                          ? "light"
                          : "subtle"
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
              <Stack gap="xs" mb={{ xs: "lg" }}>
                <Group justify="space-between">
                  <Text size="xs" fw={500}>
                    Commissioners
                  </Text>
                  <ActionIcon
                    onClick={open}
                    size="sm"
                    variant="light"
                    radius="xl"
                    aria-label="Settings"
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
                            {commissioner.user.image_file?.url ??
                            commissioner.user.image ? (
                              <ThemeIcon
                                size="lg"
                                variant="default"
                                radius="xl"
                              >
                                <Image
                                  src={
                                    commissioner.user.image ??
                                    commissioner.user.image_file?.url ??
                                    ""
                                  }
                                  alt="Profile picture"
                                  width={24}
                                  height={24}
                                  style={{
                                    borderRadius: "50%",
                                    objectFit: "cover",
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

        <AppShellAside>
          <Tabs defaultValue="voters">
            <TabsList grow>
              <Tabs.Tab value="admin">Message Admin</Tabs.Tab>
              <Tabs.Tab value="voters">Message from Voters</Tabs.Tab>
            </TabsList>

            <Box p="md">
              <TabsPanel value="admin">Message Admin content</TabsPanel>
              <TabsPanel value="voters">Message from Voters content</TabsPanel>
            </Box>
          </Tabs>
        </AppShellAside>

        <AppShellFooter>
          <Footer />
        </AppShellFooter>
      </AppShell>
    </>
  );
}
