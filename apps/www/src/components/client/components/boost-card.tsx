"use client";

import Link from "next/link";
import {
  Box,
  Button,
  Center,
  List,
  ListItem,
  Modal,
  rem,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconCircleCheck, IconRocket } from "@tabler/icons-react";

export default function BoostCard() {
  const [opened, { open, close }] = useDisclosure(false);
  return (
    <>
      <Modal
        opened={opened}
        onClose={close}
        radius="lg"
        withCloseButton={false}
        closeOnClickOutside={false}
      >
        <Center mb="lg">
          <ThemeIcon variant="gradient" size={80} radius="50%">
            <IconRocket size={40} />
          </ThemeIcon>
        </Center>
        <Title order={2} ta="center">
          Boost is available!
        </Title>

        <Center>
          <Stack align="center" gap="xs">
            <Button size="lg" radius="xl" variant="gradient">
              Get Boost
            </Button>
            <Button onClick={close} size="xs" radius="xl" variant="subtle">
              Maybe Later
            </Button>
          </Stack>
        </Center>
      </Modal>
      <Box
        p="md"
        style={{
          border: "2px solid #2f9e44",
          borderRadius: "0.5rem",
        }}
      >
        <Title order={4}>Boost is available!</Title>

        <List
          spacing={4}
          mt="xs"
          size="sm"
          center
          icon={
            <ThemeIcon variant="gradient" size={24} radius="xl">
              <IconCircleCheck style={{ width: rem(16), height: rem(16) }} />
            </ThemeIcon>
          }
        >
          <ListItem>Ad-Free</ListItem>
          <ListItem>Result Realtime Update</ListItem>
          <Text size="sm" ml={36} mt={4}>
            ...and more!
          </Text>
        </List>

        <Button mt="sm" radius="xl" variant="gradient" w="100%" onClick={open}>
          Get Boost
        </Button>
        <Button
          component={Link}
          href="/pricing"
          mt="xs"
          size="xs"
          radius="xl"
          variant="default"
          w="100%"
        >
          Learn More
        </Button>
      </Box>
    </>
  );
}
