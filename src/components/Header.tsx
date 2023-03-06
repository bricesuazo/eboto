import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import {
  Box,
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

const HeaderComponent = ({
  opened,
  setOpened,
}: {
  opened: boolean;
  setOpened: Dispatch<SetStateAction<boolean>>;
}) => {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const router = useRouter();
  const { status, data } = useSession();

  const theme = useMantineTheme();

  return (
    <Header height={60} px="md">
      <Flex h="100%" align="center" gap="xs">
        {router.pathname.includes("/dashboard") && (
          <MediaQuery largerThan="sm" styles={{ display: "none" }}>
            <Burger
              opened={opened}
              onClick={() => setOpened((o) => !o)}
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
            <Menu position="bottom-end" opened={opened} onChange={setOpened}>
              <Menu.Target>
                <UnstyledButton>
                  <Group>
                    <Image
                      src={data?.user.image || "/images/default-avatar.png"}
                      alt="Profile picture"
                      width={32}
                      height={32}
                    />

                    <Box>
                      <Text size="xs" truncate>
                        {data.user.firstName} {data.user.lastName}
                      </Text>
                      <Text weight="normal" size="xs" w="20" truncate>
                        {data.user.email}
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
    </Header>
  );
};

export default HeaderComponent;
