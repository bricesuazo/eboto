"use client";

import { useStore } from "@/store";
import { SignInButton, SignUpButton, useClerk } from "@clerk/nextjs";
import { User } from "@clerk/nextjs/api";
import {
  ActionIcon,
  Box,
  Burger,
  Button,
  Container, // Flex,
  Group, // Header,
  Menu,
  Text,
  UnstyledButton,
  useMantineColorScheme,
  useMantineTheme,
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
import { useParams, usePathname } from "next/navigation";

export default function HeaderContent({ user }: { user: User | null }) {
  const { signOut } = useClerk();

  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const pathname = usePathname();
  const params = useParams();

  const theme = useMantineTheme();

  const store = useStore();
  const [openedMenu, { open: openMenu, close: closeMenu }] =
    useDisclosure(false);

  return (
    <>
      {/* <Header height={60}> */}
      <Container
        h="100%"
        size={!params?.electionDashboardSlug ? undefined : "full"}
      >
        <Group h="100%" align="center" gap="xs">
          {params?.electionDashboardSlug && (
            <Burger
              opened={store.dashboardMenu}
              onClick={() => store.toggleDashboardMenu()}
              size="sm"
              color={theme.colors.gray[6]}
              py="xl"
              // style={(theme) => ({
              //   [theme.fn.largerThan("xs")]: { display: "none" },
              // })}
            />
          )}
          <Group justify="space-between">
            <UnstyledButton component={Link} href={user ? "/dashboard" : "/"}>
              <Group gap="md">
                <Image
                  src="/images/logo.png"
                  alt="eBoto Mo Logo"
                  width={32}
                  height={32}
                  priority
                />
                <Text
                  fw={600}
                  color={
                    colorScheme === "dark"
                      ? theme.colors.gray[0]
                      : theme.colors.gray[9]
                  }
                  // style={(theme) => ({
                  //   [theme.fn.smallerThan("xs")]: { display: "none" },
                  // })}
                >
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
                  <UnstyledButton py="md">
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
                          width: 80,
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
                      colorScheme === "light" ? (
                        <IconMoon size={16} />
                      ) : (
                        <IconSun size={16} />
                      )
                    }
                    onClick={() =>
                      setColorScheme(colorScheme === "dark" ? "light" : "dark")
                    }
                    closeMenuOnClick={false}
                  >
                    {colorScheme === "light" ? "Dark mode" : "Light mode"}
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
                    setColorScheme(colorScheme === "dark" ? "light" : "dark")
                  }
                >
                  {colorScheme === "dark" ? (
                    <IconSun size="1rem" />
                  ) : (
                    <IconMoon size="1rem" />
                  )}
                </ActionIcon>
                <SignInButton mode="redirect">
                  <Button
                  // style={(theme) => ({
                  //   [theme.fn.smallerThan("xs")]: { display: "none" },
                  // })}
                  >
                    Sign in
                  </Button>
                  <Button
                    variant="outline"
                    // style={(theme) => ({
                    //   [theme.fn.largerThan("xs")]: { display: "none" },
                    // })}
                  >
                    Sign in
                  </Button>
                </SignInButton>

                <SignUpButton mode="redirect">
                  <Button>Get Started</Button>
                </SignUpButton>
              </Group>
            )}
          </Group>
        </Group>
      </Container>
      {/* </Header> */}
    </>
  );
}
