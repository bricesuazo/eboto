"use client";

import { type User } from "@eboto-mo/db/schema";
import {
  ActionIcon,
  Box,
  Burger,
  Button,
  Container,
  Flex,
  Group,
  Header,
  MediaQuery,
  Menu,
  Text,
  UnstyledButton,
  useMantineColorScheme,
  useMantineTheme,
} from "@mantine/core";
import { IconLogout } from "@tabler/icons-react";
import {
  IconAlertCircle,
  IconChartBar,
  IconChevronDown,
  IconUserCircle,
} from "@tabler/icons-react";
import { IconMoon } from "@tabler/icons-react";
import { IconSun } from "@tabler/icons-react";
import { signIn, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function HeaderContent({ user }: { user: User | null }) {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const pathname = usePathname();

  const theme = useMantineTheme();
  const [opened, setOpened] = useState(false);

  return (
    <Header height={60}>
      <Container
        h="100%"
        size={
          !pathname.includes("/dashboard/[electionSlug]") ? undefined : "full"
        }
      >
        <Flex h="100%" align="center" gap="xs">
          {pathname.includes("/dashboard/[electionSlug]") && (
            <MediaQuery largerThan="sm" styles={{ display: "none" }}>
              <Burger
                opened={opened}
                onClick={() => setOpened((o) => !o)}
                size="sm"
                color={theme.colors.gray[6]}
                py="xl"
              />
            </MediaQuery>
          )}
          <Group position="apart" w="100%" spacing={0}>
            <UnstyledButton component={Link} href={user ? "/dashboard" : "/"}>
              <Group spacing={4}>
                <Image
                  src="/images/logo.png"
                  alt="eBoto Mo Logo"
                  width={32}
                  height={32}
                  priority
                />
                <Text
                  weight={600}
                  color={
                    colorScheme === "dark"
                      ? theme.colors.gray[0]
                      : theme.colors.gray[9]
                  }
                  sx={(theme) => ({
                    [theme.fn.smallerThan("xs")]: { display: "none" },
                  })}
                >
                  eBoto Mo
                </Text>
              </Group>
            </UnstyledButton>
            <Button component={Link} href="/about">
              About page
            </Button>
            {user ? (
              <Menu
                position="bottom-end"
                opened={opened}
                onChange={setOpened}
                withinPortal
                width={200}
              >
                <Menu.Target>
                  <UnstyledButton py="md">
                    <Group spacing="xs">
                      <Box
                        sx={{
                          position: "relative",
                          borderRadius: "50%",
                          overflow: "hidden",
                          width: 24,
                          height: 24,

                          [theme.fn.largerThan("sm")]: {
                            width: 32,
                            height: 32,
                          },
                        }}
                      >
                        <Image
                          src={user.image_link || "/images/default-avatar.png"}
                          alt="Profile picture"
                          fill
                          sizes="100%"
                          priority
                          style={{ objectFit: "cover" }}
                        />
                      </Box>

                      <Box
                        sx={{
                          width: 80,
                          [theme.fn.largerThan("sm")]: {
                            width: 140,
                          },
                        }}
                      >
                        <Text size="xs" truncate weight="bold">
                          {user.first_name} {user.last_name}
                        </Text>
                        <Text size="xs" truncate>
                          {user.email}
                        </Text>
                      </Box>

                      <IconChevronDown
                        size={16}
                        style={{
                          rotate: opened ? "-180deg" : "0deg",
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
                    icon={<IconChartBar size={16} />}
                  >
                    Dashboard
                  </Menu.Item>
                  <Menu.Item
                    component={Link}
                    href="/account"
                    icon={<IconUserCircle size={16} />}
                  >
                    Account settings
                  </Menu.Item>

                  <Menu.Item
                    icon={
                      colorScheme === "light" ? (
                        <IconMoon size={16} />
                      ) : (
                        <IconSun size={16} />
                      )
                    }
                    onClick={() => toggleColorScheme()}
                    closeMenuOnClick={false}
                  >
                    {colorScheme === "light" ? "Dark mode" : "Light mode"}
                  </Menu.Item>
                  <Menu.Item
                    icon={<IconAlertCircle size={16} />}
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
                    icon={
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
              <Group spacing="xs">
                <ActionIcon
                  variant="subtle"
                  size={36}
                  onClick={() => toggleColorScheme()}
                >
                  {colorScheme === "dark" ? (
                    <IconSun size="1rem" />
                  ) : (
                    <IconMoon size="1rem" />
                  )}
                </ActionIcon>
                <MediaQuery largerThan="xs" styles={{ display: "none" }}>
                  <Button
                    // component={Link} href="/signin"
                    onClick={() => signIn()}
                  >
                    Sign in
                  </Button>
                </MediaQuery>
                <MediaQuery smallerThan="xs" styles={{ display: "none" }}>
                  <Button
                    variant="outline"
                    // component={Link} href="/signin"
                    onClick={() => signIn()}
                  >
                    Sign in
                  </Button>
                </MediaQuery>
                <MediaQuery smallerThan="xs" styles={{ display: "none" }}>
                  <Button
                    // component={Link} href="/signup"
                    onClick={() => signIn()}
                  >
                    Get Started
                  </Button>
                </MediaQuery>
              </Group>
            )}
          </Group>
        </Flex>
      </Container>
    </Header>
  );
}
