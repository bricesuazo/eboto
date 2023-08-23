"use client";

import { env } from "@/env.mjs";
import { useStore } from "@/store";
import classes from "@/styles/Header.module.css";
import { api } from "@/trpc/client";
import { useClerk } from "@clerk/nextjs";
import type { User } from "@clerk/nextjs/api";
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
  Select,
  Stack,
  Text,
  TextInput,
  Textarea,
  UnstyledButton,
  useComputedColorScheme,
  useMantineColorScheme,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconAlertCircle,
  IconChartBar,
  IconChevronDown,
  IconLogout,
  IconMoon,
  IconSun,
  IconUserCircle,
} from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function HeaderContent({ user }: { user: User | null }) {
  const { signOut } = useClerk();
  const params = useParams();
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [reportAProblemLoading, setReportAProblemLoading] = useState(false);
  const reportAProblemMutation = api.election.reportAProblem;

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
    election_id: string | null;
  }>({
    initialValues: {
      subject: "",
      description: "",
      election_id: null,
    },
    validate: (values) => {
      const errors: Record<string, string> = {};

      if (!values.subject.trim() ?? !values.subject.length) {
        errors.subject = "Subject is required";
      }

      if (!values.description.trim() ?? !values.description.length) {
        errors.description = "Description is required";
      }

      if (!values.election_id?.trim() ?? !values.election_id.length) {
        errors.election_id = "Election is required";
      }

      return errors;
    },
  });

  const data = ["React", "Angular", "Vue", "Svelte"];

  useEffect(() => {
    if (openedReportAProblem) {
      formReportAProblem.reset();
    }
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
              await reportAProblemMutation.mutate({
                ...values,
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
              label="Your favorite library"
              placeholder="Pick value"
              data={data}
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
      <Container
        h="100%"
        size={!params.electionDashboardSlug ? "md" : undefined}
      >
        <Flex h="100%" align="center" justify="space-between" gap="xs">
          <Flex h="100%" align="center">
            <UnstyledButton component={Link} href={user ? "/dashboard" : "/"}>
              <Group gap="xs" align="center">
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
              </Group>
            </UnstyledButton>

            <Center h="100%">
              <Burger
                opened={store.dashboardMenu}
                onClick={() => store.toggleDashboardMenu()}
                size="sm"
                color="gray.6"
                py="xl"
                hiddenFrom="xs"
                h="100%"
                hidden={!params.electionDashboardSlug}
              />
            </Center>
          </Flex>

          {user ? (
            <Menu
              position="bottom-end"
              opened={openedMenu}
              onChange={toggle}
              withinPortal
              width={200}
            >
              <MenuTarget>
                <UnstyledButton h="100%">
                  <Flex gap="xs">
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
                      <Image
                        src={user.imageUrl}
                        alt="Profile picture"
                        fill
                        sizes="100%"
                        priority
                        style={{
                          objectFit: "cover",
                        }}
                      />
                    </Box>

                    <Box w={{ base: 100, sm: 140 }}>
                      <Text size="xs" truncate fw="bold">
                        {user.firstName} {user.lastName}
                      </Text>
                      <Text size="xs" truncate>
                        {user.emailAddresses[0]?.emailAddress}
                      </Text>
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
                  component={Link}
                  href="/dashboard"
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
                  {computedColorScheme === "light" ? "Dark mode" : "Light mode"}
                </MenuItem>
                <MenuItem
                  leftSection={<IconAlertCircle size={16} />}
                  onClick={openReportAProblem}
                >
                  Report a problem
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setLogoutLoading(true);
                    void (async () =>
                      await signOut({
                        // callbackUrl: "/signin",
                      }))();
                  }}
                  closeMenuOnClick={false}
                  leftSection={
                    !logoutLoading ? (
                      <IconLogout
                        style={{
                          transform: "translateX(2px)",
                        }}
                        size={16}
                      />
                    ) : undefined
                  }
                  disabled={logoutLoading}
                >
                  {logoutLoading ? (
                    <Center>
                      <Loader size="xs" />
                    </Center>
                  ) : (
                    "Log out"
                  )}
                </MenuItem>
              </MenuDropdown>
            </Menu>
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

              <Button
                hiddenFrom="sm"
                component={Link}
                href={env.NEXT_PUBLIC_CLERK_SIGN_IN_URL}
              >
                Sign in
              </Button>
              <Button
                variant="outline"
                visibleFrom="sm"
                component={Link}
                href={env.NEXT_PUBLIC_CLERK_SIGN_IN_URL}
              >
                Sign in
              </Button>

              <Button
                visibleFrom="sm"
                component={Link}
                href={env.NEXT_PUBLIC_CLERK_SIGN_UP_URL}
              >
                Get Started
              </Button>
            </Group>
          )}
        </Flex>
      </Container>
    </>
  );
}
