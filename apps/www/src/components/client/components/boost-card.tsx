"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Box,
  Button,
  Center,
  Flex,
  List,
  ListItem,
  Modal,
  NumberFormatter,
  rem,
  Slider,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconCircleCheck, IconRocket } from "@tabler/icons-react";

import { PRICING } from "@eboto/constants";

export default function BoostCard() {
  const [value, setValue] = useState(0);
  const [opened, { open, close }] = useDisclosure(false);
  return (
    <>
      <Modal
        opened={opened}
        onClose={close}
        radius="lg"
        withCloseButton={false}
        closeOnClickOutside={false}
        padding="xl"
      >
        <Center mb="lg">
          <ThemeIcon variant="gradient" size={80} radius="50%">
            <IconRocket size={40} />
          </ThemeIcon>
        </Center>
        <Title order={2} ta="center">
          Boost is available!
        </Title>

        <Box>
          <Title order={1} ta="center">
            {PRICING.find((item) => item.value === value)?.label === -1 ? (
              "Contact us"
            ) : (
              <NumberFormatter
                prefix="₱ "
                value={
                  499 +
                  (PRICING.find((item) => item.value === value)?.price_added ??
                    0)
                }
                fixedDecimalScale
                decimalScale={2}
              />
            )}{" "}
          </Title>
          <Slider
            value={value}
            onChange={setValue}
            mt="xl"
            thumbSize={20}
            step={20}
            label={(value) =>
              PRICING.find((item) => item.value === value)?.label === -1 ? (
                "Unlimited"
              ) : (
                <NumberFormatter
                  value={PRICING.find((item) => item.value === value)?.label}
                  thousandSeparator
                />
              )
            }
            marks={PRICING.map((item) => ({
              value: item.value,
              // label: item.label === -1 ? "Unlimited" : item.label,
            }))}
          />
          <Text ta="center" mt="md">
            with up to{" "}
            {PRICING.find((item) => item.value === value)?.label === -1 ? (
              "Unlimited"
            ) : (
              <NumberFormatter
                value={PRICING.find((item) => item.value === value)?.label}
                thousandSeparator
              />
            )}{" "}
            voters
          </Text>

          <Text fz="lg" fw={600} mt="lg" mb="xs">
            Key Features
          </Text>

          <List
            spacing="xs"
            center
            icon={
              <ThemeIcon variant="gradient" size={24} radius="xl">
                <IconCircleCheck style={{ width: rem(16), height: rem(16) }} />
              </ThemeIcon>
            }
          >
            <ListItem>Ad-Free</ListItem>
            <ListItem>Realtime Update</ListItem>
            <ListItem>Realtime Chat w/ Voters</ListItem>
            <ListItem>No Watermark</ListItem>
            <Text ml={36} mt="xs">
              ...and more!
            </Text>
          </List>
        </Box>

        <Box mt="xl">
          <Stack gap="xs">
            <Flex gap="xs" direction={{ base: "column", xs: "row" }}>
              {PRICING.find((item) => item.value === value)?.label === -1 ? (
                <Button
                  component={Link}
                  href="/contact"
                  size="lg"
                  radius="xl"
                  variant="gradient"
                  w="100%"
                >
                  Get Boost
                </Button>
              ) : (
                <Button size="lg" radius="xl" variant="gradient" w="100%">
                  Get Boost
                </Button>
              )}
              <Button
                hiddenFrom="xs"
                component={Link}
                href="/pricing"
                radius="xl"
                variant="default"
                size="sm"
              >
                Learn More
              </Button>
              <Button
                visibleFrom="xs"
                component={Link}
                href="/pricing"
                radius="xl"
                variant="default"
                size="lg"
                w="100%"
              >
                Learn More
              </Button>
            </Flex>
            <Button
              onClick={close}
              size="xs"
              radius="xl"
              variant="subtle"
              style={{
                width: "fit-content",
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              Maybe Later
            </Button>
          </Stack>
        </Box>
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
          <ListItem>Live Support</ListItem>
          <ListItem>Realtime Chat w/ Voters</ListItem>
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
