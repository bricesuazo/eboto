"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Flex,
  List,
  ListItem,
  NumberFormatter,
  rem,
  Slider,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCircleCheck, IconMail, IconPlus } from "@tabler/icons-react";
import Balancer from "react-wrap-balancer";

import { PRICING } from "@eboto/constants";

import classes from "~/styles/Pricing.module.css";
import { api } from "~/trpc/client";
import { GetBoostButton } from "./get-boost-button";
import KeyFeatures from "./key-features";

export function MainPricing({
  initialValue,
  setInitialValue,
}: {
  initialValue?: number;
  setInitialValue?: (value: number) => void;
}) {
  const [value, setValue] = useState(initialValue ?? 0);
  const router = useRouter();
  const userQuery = api.auth.getUser.useQuery();

  const [isRedirecting, setIsRedirecting] = useState(false);
  const plusMutation = api.payment.plus.useMutation({
    onSuccess: (url) => {
      if (!url) return;

      setIsRedirecting(true);
      router.push(url);
    },
    onError: (error) => {
      notifications.show({
        title: "Error",
        message: error.message,
        color: "red",
        autoClose: 3000,
      });
    },
  });

  useEffect(() => {
    setValue(initialValue ?? 0);
  }, [initialValue]);

  useEffect(() => {
    if (!setInitialValue) return;

    setInitialValue(value);
  }, [value, setInitialValue]);
  return (
    <>
      <Title ta="center">Pricing</Title>
      <Text ta="center">
        <Balancer>Unlock more features: Your Election Boost awaits.</Balancer>
      </Text>

      <Stack gap="xl">
        <Flex
          mt="xl"
          gap="md"
          align={{ md: "center" }}
          direction={{ base: "column", md: "row" }}
        >
          <Box mih={{ base: "20rem", sm: "28rem" }} className={classes.card}>
            <Box>
              <Title order={2}>Free</Title>
              <Text>For a lifetime</Text>
              <Text fz="lg" fw={600} mt="lg" mb="xs">
                Key Features
              </Text>

              <List
                spacing="xs"
                size="sm"
                center
                icon={
                  <ThemeIcon variant="default" size={24} radius="xl">
                    <IconCircleCheck
                      style={{ width: rem(16), height: rem(16) }}
                    />
                  </ThemeIcon>
                }
              >
                <ListItem>Every Hour Result Realtime Update</ListItem>
                <ListItem>Up to 500 voters</ListItem>
                <ListItem>Live Admin Support</ListItem>
              </List>
            </Box>

            <Button
              component={Link}
              href="/register"
              size="lg"
              radius="xl"
              variant="default"
              w="100%"
            >
              Register
            </Button>
          </Box>
          <Box
            mih={{ base: "20rem", sm: "32rem" }}
            className={classes.card + " " + classes.boost}
          >
            <Box>
              <Title order={2}>Boost</Title>
              <Title>
                {PRICING.find((item) => item.value === value)?.label === -1 ? (
                  "Contact us"
                ) : (
                  <NumberFormatter
                    prefix="₱ "
                    value={
                      499 +
                      (PRICING.find((item) => item.value === value)
                        ?.price_added ?? 0)
                    }
                    fixedDecimalScale
                    decimalScale={2}
                  />
                )}
              </Title>
              <Text>Per Election</Text>
              <Text>
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
                      value={
                        PRICING.find((item) => item.value === value)?.label
                      }
                      thousandSeparator
                    />
                  )
                }
                marks={PRICING.map((item) => ({
                  value: item.value,
                  // label: item.label === -1 ? "Unlimited" : item.label,
                }))}
              />
              <KeyFeatures />
            </Box>
            <GetBoostButton value={value} />
          </Box>
          <Box mih={{ base: "20rem", sm: "28rem" }} className={classes.card}>
            <Box>
              <Title order={2}>Custom</Title>
              <Text>Want us to host your election locally?</Text>
              <Text fz="lg" fw={600} mt="lg" mb="xs">
                Key Features
              </Text>

              <List
                spacing="xs"
                size="sm"
                center
                icon={
                  <ThemeIcon variant="default" size={24} radius="xl">
                    <IconCircleCheck
                      style={{ width: rem(16), height: rem(16) }}
                    />
                  </ThemeIcon>
                }
              >
                <ListItem>Unlimited Voters</ListItem>
                <ListItem>We will host your election in your facility</ListItem>
              </List>
            </Box>
            <Button
              component={Link}
              href="/contact"
              size="lg"
              radius="xl"
              variant="outline"
              w="100%"
              rightSection={<IconMail />}
            >
              Contact Us
            </Button>
          </Box>
        </Flex>
        <Flex
          direction={{ base: "column", md: "row" }}
          justify="space-between"
          className={classes.card}
        >
          <Box style={{ flex: 4 }}>
            <Title order={2}>Plus</Title>
            <Title>
              <NumberFormatter
                prefix="₱ "
                value={199}
                fixedDecimalScale
                decimalScale={2}
              />
            </Title>
            <Text>Per Election</Text>
          </Box>
          <Box style={{ flex: 2 }}>
            <Text fz="lg" fw={600}>
              Key Features
            </Text>

            <List
              spacing="xs"
              size="sm"
              center
              icon={
                <ThemeIcon size={24} radius="xl">
                  <IconCircleCheck
                    style={{ width: rem(16), height: rem(16) }}
                  />
                </ThemeIcon>
              }
            >
              <ListItem>Add 1 election to your account</ListItem>
            </List>
          </Box>

          <Flex style={{ flex: 4 }} justify={{ md: "end" }}>
            {userQuery.data ? (
              <Button
                w={{ base: "100%", md: "auto" }}
                size="lg"
                radius="xl"
                style={{ marginBottom: "auto" }}
                loading={plusMutation.isPending}
                onClick={() => plusMutation.mutate({ quantity: 1 })}
                rightSection={!isRedirecting ? <IconPlus /> : undefined}
                disabled={isRedirecting}
              >
                {isRedirecting ? "Redirecting..." : "Get Plus"}
              </Button>
            ) : (
              <Button
                w={{ base: "100%", md: "auto" }}
                size="lg"
                radius="xl"
                style={{ marginBottom: "auto" }}
                rightSection={<IconPlus />}
                component={Link}
                href="/sign-in"
                disabled={plusMutation.isPending || userQuery.isLoading}
              >
                Get Plus
              </Button>
            )}
          </Flex>
        </Flex>
      </Stack>
    </>
  );
}
