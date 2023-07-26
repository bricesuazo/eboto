"use client";

import { env } from "@/env.mjs";
import { useStore } from "@/store";
import classes from "@/styles/Header.module.css";
import { useClerk } from "@clerk/nextjs";
import type { User } from "@clerk/nextjs/api";
import {
  ActionIcon,
  Box,
  Burger,
  Button,
  Container,
  Group,
  Menu,
  Text,
  UnstyledButton,
  useComputedColorScheme,
  useMantineColorScheme,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconLogout } from "@tabler/icons-react";
import {
  IconAlertCircle,
  IconChartBar,
  IconChevronDown,
  IconUserCircle,
} from "@tabler/icons-react";
import { IconMoon } from "@tabler/icons-react";
import { IconSun } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function HeaderContent({ user }: { user: User | null }) {
  const { signOut } = useClerk();
  const params = useParams();

  const { setColorScheme } = useMantineColorScheme();

  const [openedMenu, { open: openMenu, close: closeMenu }] =
    useDisclosure(false);

  const computedColorScheme = useComputedColorScheme("light", {
    getInitialValueInEffect: true,
  });

  const store = useStore();

  return (
    <>
      <Container h="100%" size="md">
        <Group h="100%" align="center" justify="space-between" gap="xs">
          {params?.electionDashboardSlug && (
            <Burger
              opened={store.dashboardMenu}
              onClick={() => store.toggleDashboardMenu()}
              size="sm"
              color="gray.6"
              py="xl"
              visibleFrom="sm"
            />
          )}

          <UnstyledButton component={Link} href={user ? "/dashboard" : "/"}>
            <Group gap="xs">
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
          {user ? (
            <Menu
              position="bottom-end"
              opened={openedMenu}
              onChange={() => (openedMenu ? closeMenu() : openMenu())}
              withinPortal
              width={200}
            >
              <Menu.Target>
                <UnstyledButton h="100%">
                  <Group gap="xs">
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
                        style={{ objectFit: "cover" }}
                      />
                    </Box>

                    <Box
                      style={{
                        width: 100,
                        // [theme.fn.largerThan("sm")]: {
                        //   width: 140,
                        // },
                      }}
                    >
                      <Text size="xs" truncate fw="bold">
                        {user.firstName} {user.lastName}
                      </Text>
                      <Text size="xs" truncate>
                        {user.emailAddresses[0].emailAddress}
                      </Text>
                    </Box>

                    <IconChevronDown
                      size={16}
                      style={{
                        rotate: openedMenu ? "-180deg" : "0deg",
                        transition: "all 0.25s",
                      }}
                    />
                  </Group>
                </UnstyledButton>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Item
                  component={Link}
                  href="/dashboard"
                  leftSection={<IconChartBar size={16} />}
                >
                  Dashboard
                </Menu.Item>
                <Menu.Item
                  component={Link}
                  href="/account"
                  leftSection={<IconUserCircle size={16} />}
                >
                  Account settings
                </Menu.Item>

                <Menu.Item
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
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconAlertCircle size={16} />}
                  // onClick={openReportAProblem}
                >
                  Report a problem
                </Menu.Item>
                <Menu.Item
                  onClick={() =>
                    void (async () =>
                      await signOut({
                        // callbackUrl: "/signin",
                      }))()
                  }
                  leftSection={
                    <IconLogout
                      style={{
                        transform: "translateX(2px)",
                      }}
                      size={16}
                    />
                  }
                >
                  Log out
                </Menu.Item>
              </Menu.Dropdown>
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
        </Group>
      </Container>
    </>
  );
}
