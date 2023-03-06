import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import {
  Button,
  Group,
  Menu,
  Text,
  UnstyledButton,
  useMantineColorScheme,
  Header,
  MediaQuery,
  Burger,
  useMantineTheme,
  Flex,
  ActionIcon,
  Container,
  Box,
} from "@mantine/core";
import {
  IconChartBar,
  IconChevronDown,
  IconMoon,
  IconSun,
  IconTransitionLeft,
} from "@tabler/icons-react";
import type { Dispatch, SetStateAction } from "react";
import { useRouter } from "next/router";
import { useState } from "react";

const HeaderComponent = ({
  isNavbarOpen,
  setIsNavbarOpenOpened,
}: {
  isNavbarOpen: boolean;
  setIsNavbarOpenOpened: Dispatch<SetStateAction<boolean>>;
}) => {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const router = useRouter();
  const { status, data } = useSession();

  const theme = useMantineTheme();
  const [opened, setOpened] = useState(false);

  return (
    <Header height={60}>
      <Container
        h="100%"
        size={
          !router.pathname.includes("/dashboard/[electionSlug]")
            ? undefined
            : "full"
        }
      >
        <Flex h="100%" align="center" gap="xs">
          {router.pathname.includes("/dashboard/[electionSlug]") && (
            <MediaQuery largerThan="sm" styles={{ display: "none" }}>
              <Burger
                opened={isNavbarOpen}
                onClick={() => setIsNavbarOpenOpened((o) => !o)}
                size="sm"
                color={theme.colors.gray[6]}
              />
            </MediaQuery>
          )}
          <Group position="apart" w="100%" spacing={0}>
            <UnstyledButton component={Link} href="/">
              <Group spacing={4}>
                <Image
                  src="/images/eboto-mo-logo.png"
                  alt="eBoto Mo Logo"
                  width={32}
                  height={32}
                />
                <Text weight={600}>eBoto Mo</Text>
              </Group>
            </UnstyledButton>

            {status === "unauthenticated" && (
              <Group spacing="xs">
                <ActionIcon
                  variant="subtle"
                  size={36}
                  onClick={() => {
                    toggleColorScheme();
                  }}
                >
                  {colorScheme === "dark" ? (
                    <IconSun size="1rem" />
                  ) : (
                    <IconMoon size="1rem" />
                  )}
                </ActionIcon>
                <MediaQuery largerThan="xs" styles={{ display: "none" }}>
                  <Button component={Link} href="/signin">
                    Sign in
                  </Button>
                </MediaQuery>
                <MediaQuery smallerThan="xs" styles={{ display: "none" }}>
                  <Button variant="outline" component={Link} href="/signin">
                    Sign in
                  </Button>
                </MediaQuery>
                <MediaQuery smallerThan="xs" styles={{ display: "none" }}>
                  <Button component={Link} href="/signup">
                    Get Started
                  </Button>
                </MediaQuery>
              </Group>
            )}
            {status === "authenticated" && (
              <Menu
                position="bottom-end"
                opened={opened}
                onChange={setOpened}
                withinPortal
              >
                <Menu.Target>
                  <UnstyledButton>
                    <Group spacing="xs">
                      <Box
                        sx={{
                          position: "relative",
                          borderRadius: "50%",
                          overflow: "hidden",
                          width: 32,
                          height: 32,

                          "@media (max-width: 30em)": {
                            width: 24,
                            height: 24,
                          },
                        }}
                      >
                        <Image
                          src={data?.user.image || "/images/default-avatar.png"}
                          alt="Profile picture"
                          fill
                          sizes="100%"
                        />
                      </Box>

                      <Text
                        size="xs"
                        truncate
                        sx={{
                          width: 64,
                          "@media (max-width: 30em)": {
                            width: 42,
                          },
                        }}
                      >
                        {data.user.firstName} {data.user.lastName}
                      </Text>

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
                    onClick={() =>
                      signOut({
                        callbackUrl: "/signin",
                      })
                    }
                    icon={<IconTransitionLeft size={16} />}
                  >
                    Log out
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            )}
          </Group>
        </Flex>
      </Container>
    </Header>
  );
};

export default HeaderComponent;
