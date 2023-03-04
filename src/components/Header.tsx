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
} from "@mantine/core";
import {
  IconChartBar,
  IconChevronDown,
  IconMoon,
  IconSun,
  IconTransitionLeft,
} from "@tabler/icons-react";
import { useState } from "react";

const Header = () => {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const { status, data } = useSession();
  const [opened, setOpened] = useState(false);

  return (
    <header>
      <Group position="apart" p="md">
        <UnstyledButton component={Link} href="/">
          <Group spacing={8}>
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
            <Button variant="outline" component={Link} href="/signin">
              Sign in
            </Button>

            <Button component={Link} href="/signup">
              Get Started
            </Button>
          </Group>
        )}
        {status === "authenticated" && (
          <Menu position="bottom-end" opened={opened} onChange={setOpened}>
            <Menu.Target>
              <UnstyledButton>
                <Group>
                  <Box>
                    <Image
                      src={data?.user.image || "/images/default-avatar.png"}
                      alt="Profile picture"
                      width={32}
                      height={32}
                    />
                  </Box>
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
    </header>
  );
};

export default Header;
