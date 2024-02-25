"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import KeyFeatures from "@/components/key-features";
import ElectionBoost from "@/components/modals/election-boost";
import { useStore } from "@/store";
import classes from "@/styles/Pricing.module.css";
import { api } from "@/trpc/client";
import {
  Box,
  Button,
  Container,
  Flex,
  List,
  ListItem,
  NumberFormatter,
  rem,
  Slider,
  Stack,
  Table,
  TableScrollContainer,
  TableTbody,
  TableTd,
  TableTfoot,
  TableTh,
  TableThead,
  TableTr,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconCircleCheck,
  IconCircleX,
  IconMail,
  IconPlus,
  IconRocket,
} from "@tabler/icons-react";
import { useSession } from "next-auth/react";
import Balancer from "react-wrap-balancer";

import { PRICING } from "@eboto/constants";

export const dynamic = "force-static";

export default function PricingPage() {
  const [value, setValue] = useState(0);

  return (
    <>
      <ElectionBoost value={value} />

      <Container py="xl">
        <MainPricing initialValue={value} setInitialValue={setValue} />

        <Box mt={128}>
          <Title ta="center">Compare</Title>
          <Text ta="center">
            <Balancer>
              Compare all features between Free and Boost to see which one is
              right for you.
            </Balancer>
          </Text>
          <TableScrollContainer minWidth={0}>
            <Table striped verticalSpacing="md">
              <TableThead>
                <TableTr>
                  <TableTh></TableTh>
                  <TableTh>
                    <Title order={3}>Free</Title>
                    <Text>For a lifetime</Text>
                  </TableTh>
                  <TableTh>
                    <Title order={3}>Boost</Title>
                    <Text>Per Election</Text>
                  </TableTh>
                </TableTr>
              </TableThead>
              <TableTbody fz="md">
                <TableTr>
                  <TableTd>Price</TableTd>
                  <TableTd>
                    <NumberFormatter
                      prefix="₱ "
                      value={0}
                      fixedDecimalScale
                      decimalScale={2}
                    />
                  </TableTd>
                  <TableTd fw="bold">
                    {PRICING.find((item) => item.value === value)?.label ===
                    -1 ? (
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
                  </TableTd>
                </TableTr>
                <TableTr>
                  <TableTd>Number of Voters</TableTd>
                  <TableTd>Up to 500</TableTd>
                  <TableTd fw="bold">
                    {PRICING.find((item) => item.value === value)?.label ===
                    -1 ? (
                      "Unlimited"
                    ) : (
                      <>
                        Up to{" "}
                        <NumberFormatter
                          value={
                            PRICING.find((item) => item.value === value)?.label
                          }
                          thousandSeparator
                        />
                      </>
                    )}

                    <Slider
                      value={value}
                      onChange={setValue}
                      mt="xl"
                      thumbSize={20}
                      step={20}
                      label={(value) =>
                        PRICING.find((item) => item.value === value)?.label ===
                        -1 ? (
                          "Unlimited"
                        ) : (
                          <NumberFormatter
                            value={
                              PRICING.find((item) => item.value === value)
                                ?.label
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
                  </TableTd>
                </TableTr>
                <TableTr>
                  <TableTd>Ad-Free</TableTd>
                  <TableTd>
                    <ThemeIcon variant="default" size={24} radius="xl">
                      <IconCircleX
                        style={{ width: rem(16), height: rem(16) }}
                      />
                    </ThemeIcon>
                  </TableTd>
                  <TableTd>
                    <ThemeIcon variant="gradient" size={24} radius="xl">
                      <IconCircleCheck
                        style={{ width: rem(16), height: rem(16) }}
                      />
                    </ThemeIcon>
                  </TableTd>
                </TableTr>
                <TableTr>
                  <TableTd>Live Support</TableTd>
                  <TableTd>
                    <ThemeIcon variant="default" size={24} radius="xl">
                      <IconCircleX
                        style={{ width: rem(16), height: rem(16) }}
                      />
                    </ThemeIcon>
                  </TableTd>
                  <TableTd>
                    <ThemeIcon variant="gradient" size={24} radius="xl">
                      <IconCircleCheck
                        style={{ width: rem(16), height: rem(16) }}
                      />
                    </ThemeIcon>
                  </TableTd>
                </TableTr>
                <TableTr>
                  <TableTd>Realtime Chat w/ Voters</TableTd>
                  <TableTd>
                    <ThemeIcon variant="default" size={24} radius="xl">
                      <IconCircleX
                        style={{ width: rem(16), height: rem(16) }}
                      />
                    </ThemeIcon>
                  </TableTd>
                  <TableTd>
                    <ThemeIcon variant="gradient" size={24} radius="xl">
                      <IconCircleCheck
                        style={{ width: rem(16), height: rem(16) }}
                      />
                    </ThemeIcon>
                  </TableTd>
                </TableTr>
                <TableTr>
                  <TableTd>Result Realtime Update</TableTd>
                  <TableTd>Every hour</TableTd>
                  <TableTd fw="bold">Every second</TableTd>
                </TableTr>
                <TableTr>
                  <TableTd>Watermark</TableTd>
                  <TableTd>
                    <ThemeIcon variant="default" size={24} radius="xl">
                      <IconCircleX
                        style={{ width: rem(16), height: rem(16) }}
                      />
                    </ThemeIcon>
                  </TableTd>
                  <TableTd>
                    <ThemeIcon variant="gradient" size={24} radius="xl">
                      <IconCircleCheck
                        style={{ width: rem(16), height: rem(16) }}
                      />
                    </ThemeIcon>
                  </TableTd>
                </TableTr>
              </TableTbody>
              <TableTfoot>
                <TableTr
                  styles={{
                    tr: {
                      borderBottomWidth: 0,
                    },
                  }}
                >
                  <TableTd></TableTd>
                  <TableTd>
                    <Button
                      component={Link}
                      href="/register"
                      w="100%"
                      radius="xl"
                      size="lg"
                      variant="default"
                    >
                      Register
                    </Button>
                  </TableTd>
                  <TableTd>
                    <GetBoostButton value={value} />
                  </TableTd>
                </TableTr>
              </TableTfoot>
            </Table>
          </TableScrollContainer>
        </Box>
      </Container>
    </>
  );
}

export function MainPricing({
  initialValue,
  setInitialValue,
}: {
  initialValue?: number;
  setInitialValue?: (value: number) => void;
}) {
  const [value, setValue] = useState(initialValue ?? 0);
  const router = useRouter();
  const session = useSession();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const plusMutation = api.payment.plus.useMutation({
    onSuccess: (url) => {
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
            {session.status === "authenticated" ? (
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
                disabled={
                  plusMutation.isPending || session.status === "loading"
                }
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

function GetBoostButton({ value }: { value: number }) {
  const session = useSession();
  const store = useStore();

  return value === 100 ? (
    <Button
      size="lg"
      radius="xl"
      variant="gradient"
      w="100%"
      component={Link}
      href="/contact"
      rightSection={<IconMail />}
    >
      Contact Us
    </Button>
  ) : session.status === "authenticated" ? (
    <Button
      size="lg"
      radius="xl"
      variant="gradient"
      w="100%"
      rightSection={<IconRocket />}
      onClick={() => store.toggleElectionBoost(true)}
    >
      Get Boost
    </Button>
  ) : (
    <Button
      size="lg"
      radius="xl"
      variant="gradient"
      w="100%"
      disabled={session.status === "loading"}
      component={Link}
      href="/sign-in"
      rightSection={<IconRocket />}
    >
      Get Boost
    </Button>
  );
}
