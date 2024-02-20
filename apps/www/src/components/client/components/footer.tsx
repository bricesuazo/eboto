"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ActionIcon,
  Anchor,
  Container,
  Group,
  Menu,
  MenuTarget,
  Text,
  UnstyledButton,
} from "@mantine/core";
import {
  IconBrandFacebook,
  IconBrandGithub,
  IconBrandTwitter,
  IconBrandYoutube,
} from "@tabler/icons-react";

export default function Footer() {
  const params = useParams();
  return (
    <Container h="100%" fluid={!!params?.electionDashboardSlug}>
      <Group justify="space-between" w="100%" gap={0} h="100%">
        <UnstyledButton component={Link} href="/">
          <Group gap={4}>
            <Image
              src="/images/logo.png"
              alt="eBoto Logo"
              width={32}
              height={32}
              priority
            />
            <Text fw={600}>eBoto</Text>
          </Group>
        </UnstyledButton>

        <Group gap="xs">
          <ActionIcon
            variant="subtle"
            component={Link}
            href="https://www.facebook.com/ebotoapp"
            target="_blank"
            size="lg"
          >
            <IconBrandFacebook size="1.05rem" stroke={1.5} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            component={Link}
            href="https://twitter.com/ebotoapp"
            target="_blank"
            size="lg"
            visibleFrom="xs"
          >
            <IconBrandTwitter size="1.05rem" stroke={1.5} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            component={Link}
            href="https://www.youtube.com/@ebotoapp"
            target="_blank"
            size="lg"
          >
            <IconBrandYoutube size="1.05rem" stroke={1.5} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            component={Link}
            href="https://github.com/bricesuazo/eboto"
            target="_blank"
            size="lg"
            visibleFrom="sm"
          >
            <IconBrandGithub size="1.05rem" stroke={1.5} />
          </ActionIcon>

          <Anchor size="sm" component={Link} href="/contact" visibleFrom="xs">
            Contact Us
          </Anchor>

          <Menu shadow="md" width={200}>
            <MenuTarget>
              <Anchor size="sm">Legal</Anchor>
            </MenuTarget>
            <Menu.Dropdown>
              <Menu.Item component={Link} href="/privacy">
                Privacy Policy
              </Menu.Item>
              <Menu.Item component={Link} href="/terms">
                Terms & Conditions
              </Menu.Item>
              <Menu.Item component={Link} href="/cookie">
                Cookie Policy
              </Menu.Item>
              <Menu.Item component={Link} href="/disclaimer">
                Disclaimer
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>
    </Container>
  );
}
