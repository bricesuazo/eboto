"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/store";
import classes from "@/styles/Header.module.css";
import { api } from "@/trpc/client";
import {
  ActionIcon,
  Box,
  Burger,
  Button,
  Center,
  Container,
  Flex,
  Group,
  Loader,
  Menu,
  MenuDropdown,
  MenuItem,
  MenuTarget,
  Modal,
  Pill,
  Select,
  Skeleton,
  Stack,
  Text,
  Textarea,
  TextInput,
  UnstyledButton,
  useComputedColorScheme,
  useMantineColorScheme,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { spotlight } from "@mantine/spotlight";
import {
  IconAlertCircle,
  IconChartBar,
  IconChevronDown,
  IconLogout,
  IconMoon,
  IconSearch,
  IconSun,
  IconUserCircle,
} from "@tabler/icons-react";
import { signOut, useSession } from "next-auth/react";

export default function Header({ userId }: { userId?: string }) {
  const router = useRouter();
  const session = useSession();
  const params = useParams();
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [reportAProblemLoading, setReportAProblemLoading] = useState(false);
  const reportAProblemMutation = api.election.reportAProblem.useMutation();

  const electionsQuery = api.election.getAllMyElections.useQuery();

  const { setColorScheme } = useMantineColorScheme();
  const [
    openedReportAProblem,
    { open: openReportAProblem, close: closeReportAProblem },
  ] = useDisclosure(false);

  const [openedMenu, { toggle }] = useDisclosure(false);

  const computedColorScheme = useComputedColorScheme("light", {
    getInitialValueInEffect: true,
  });

  const store = useStore();

  const formReportAProblem = useForm<{
    subject: string;
    description: string;
    election_id?: string;
  }>({
    initialValues: {
      subject: "",
      description: "",
    },
    validateInputOnBlur: true,
    validateInputOnChange: true,
    validate: {
      subject: (value) => {
        if (!value.trim() || !value.length) {
          return "Subject is required";
        }
      },
      description: (value) => {
        if (!value.trim() || !value.length) {
          return "Description is required";
        }
      },
      election_id: (value) => {
        if (!value ?? !value?.length) {
          return "Election is required";
        }
      },
    },
  });

  useEffect(() => {
    if (openedReportAProblem) {
      formReportAProblem.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openedReportAProblem]);

  return (
    <>
      <Modal
        opened={openedReportAProblem}
        onClose={closeReportAProblem}
        title="Report a problem"
      >
        <form
          onSubmit={formReportAProblem.onSubmit((values) => {
            if (!values.election_id) return;

            setReportAProblemLoading(true);

            void (async () => {
              await reportAProblemMutation.mutateAsync({
                subject: values.subject,
                description: values.description,
                election_id: values.election_id!,
              });

              notifications.show({
                title: "Problem reported!",

                message: "We'll get back to you as soon as possible.",
              });
              closeReportAProblem();
              setReportAProblemLoading(false);
            })();
          })}
        >
          <Stack>
            <TextInput
              withAsterisk
              label="Subject"
              placeholder="What's the problem?"
              disabled={reportAProblemLoading}
              {...formReportAProblem.getInputProps("subject")}
            />
            <Textarea
              rows={5}
              withAsterisk
              label="Description"
              placeholder="Explain your concern..."
              disabled={reportAProblemLoading}
              {...formReportAProblem.getInputProps("description")}
            />
            <Select
              label="Election"
              placeholder="Select an election"
              withAsterisk
              data={
                electionsQuery.data?.map(({ election }) => ({
                  value: election.id,
                  label: election.name,
                })) ?? []
              }
              disabled={reportAProblemLoading}
              {...formReportAProblem.getInputProps("election_id")}
            />
            <Group justify="flex-end" mt="md">
              <Button
                type="submit"
                disabled={!formReportAProblem.isValid()}
                loading={reportAProblemLoading}
              >
                Submit
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
      <Container h="100%" fluid={!!params?.electionDashboardSlug}>
        <Flex h="100%" align="center" justify="space-between" gap="xs">
          <Flex h="100%" align="center" gap="xs">
            <UnstyledButton component={Link} href={userId ? "/dashboard" : "/"}>
              <Flex gap="xs" align="center">
                <Image
                  src="/images/logo.png"
                  alt="eBoto Mo Logo"
                  width={32}
                  height={32}
                  priority
                />
                <Text fw={600} visibleFrom="xs">
                  eBoto Mo
                </Text>
              </Flex>
            </UnstyledButton>

            <Center h="100%" hiddenFrom="xs">
              <Burger
                opened={store.dashboardMenu}
                onClick={() => store.toggleDashboardMenu()}
                size="sm"
                color="gray.6"
                py="xl"
                h="100%"
                hidden={!params?.electionDashboardSlug}
              />
            </Center>
          </Flex>

          {userId ? (
            <Group>
              <TextInput
                onClick={spotlight.open}
                leftSection={<IconSearch size="1.25rem" />}
                radius="xl"
                w={140}
                readOnly
                placeholder="Search"
                hiddenFrom="sm"
                visibleFrom="xs"
              />
              <TextInput
                onClick={spotlight.open}
                leftSection={<IconSearch size="1.25rem" />}
                rightSection={<Pill>Ctrl + K</Pill>}
                radius="xl"
                w={200}
                readOnly
                rightSectionWidth={80}
                placeholder="Search"
                visibleFrom="sm"
              />
              <Menu
                position="bottom-end"
                opened={openedMenu}
                onChange={toggle}
                withinPortal
                width={200}
              >
                <MenuTarget>
                  <UnstyledButton h="100%">
                    <Flex gap="xs" align="center">
                      <Box
                        style={{
                          position: "relative",
                          borderRadius: "50%",
                          overflow: "hidden",
                          width: 24,
                          height: 24,

                          // [theme.fn.largerThan("sm")]: {
                          //   width: 32,
                          //   height: 32,
                          // },
                        }}
                      >
                        {session.status === "authenticated" ? (
                          session.data?.user.image ? (
                            <Image
                              src={session.data?.user.image}
                              alt="Profile picture"
                              fill
                              sizes="100%"
                              priority
                              style={{
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            <IconUserCircle />
                          )
                        ) : (
                          <Skeleton w={24} h={24} />
                        )}
                      </Box>

                      <Box w={{ base: 100, sm: 140 }}>
                        {session.status === "authenticated" ? (
                          <>
                            <Text size="xs" truncate fw="bold">
                              {session.data.user.name}
                            </Text>
                            <Text size="xs" truncate>
                              {session.data.user.email}
                            </Text>
                          </>
                        ) : (
                          <>
                            <Skeleton h={12} my={4} />
                            <Skeleton h={12} my={4} />
                          </>
                        )}
                      </Box>

                      <IconChevronDown
                        size={16}
                        style={{
                          rotate: openedMenu ? "-180deg" : "0deg",
                          transition: "all 0.25s",
                        }}
                      />
                    </Flex>
                  </UnstyledButton>
                </MenuTarget>

                <MenuDropdown>
                  <MenuItem
                    // component={Link}
                    // href="/dashboard"
                    onClick={() => router.push("/dashboard")}
                    leftSection={<IconChartBar size={16} />}
                  >
                    Dashboard
                  </MenuItem>

                  <MenuItem
                    component={Link}
                    href="/account"
                    leftSection={<IconUserCircle size={16} />}
                  >
                    Account settings
                  </MenuItem>

                  <MenuItem
                    leftSection={
                      computedColorScheme === "light" ? (
                        <IconMoon size={16} />
                      ) : (
                        <IconSun size={16} />
                      )
                    }
                    onClick={() =>
                      setColorScheme(
                        computedColorScheme === "light" ? "dark" : "light",
                      )
                    }
                    closeMenuOnClick={false}
                  >
                    {computedColorScheme === "light"
                      ? "Dark mode"
                      : "Light mode"}
                  </MenuItem>
                  <MenuItem
                    leftSection={<IconAlertCircle size={16} />}
                    onClick={openReportAProblem}
                  >
                    Report a problem
                  </MenuItem>
                  <MenuItem
                    onClick={async () => {
                      setLogoutLoading(true);
                      await signOut();
                    }}
                    closeMenuOnClick={false}
                    leftSection={
                      logoutLoading ? (
                        <Loader size={16} m={0} />
                      ) : (
                        <IconLogout
                          style={{
                            transform: "translateX(2px)",
                          }}
                          size={16}
                        />
                      )
                    }
                    disabled={logoutLoading}
                  >
                    Log out
                  </MenuItem>
                </MenuDropdown>
              </Menu>
            </Group>
          ) : (
            <Group gap="xs">
              <ActionIcon
                variant="subtle"
                size={36}
                onClick={() =>
                  setColorScheme(
                    computedColorScheme === "light" ? "dark" : "light",
                  )
                }
              >
                <IconSun size="1rem" className={classes.light} />
                <IconMoon size="1rem" className={classes.dark} />
              </ActionIcon>

              <Button hiddenFrom="sm" component={Link} href="/sign-in">
                Sign in
              </Button>
              <Button
                variant="outline"
                visibleFrom="sm"
                component={Link}
                href="/sign-in"
              >
                Sign in
              </Button>

              <Button visibleFrom="sm" component={Link} href="/register">
                Get Started
              </Button>
            </Group>
          )}
        </Flex>
      </Container>
    </>
  );
}
