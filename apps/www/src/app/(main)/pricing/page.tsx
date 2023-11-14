"use client";

import { useState } from "react";
import Link from "next/link";
import classes from "@/styles/Pricing.module.css";
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
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { IconCircleCheck, IconCircleX } from "@tabler/icons-react";
import Balancer from "react-wrap-balancer";

export const dynamic = "force-static";

export default function PricingPage() {
  const [value, setValue] = useState(0);
  const voters_length = [
    {
      value: 0,
      price_added: 0,
      label: 1500,
    },
    {
      value: 20,
      price_added: 200,
      label: 2500,
    },
    {
      value: 40,
      price_added: 400,
      label: 5000,
    },
    {
      value: 60,
      price_added: 600,
      label: 7500,
    },
    {
      value: 80,
      price_added: 800,
      label: 10000,
    },
    {
      value: 100,
      label: -1,
    },
  ];
  return (
    <Container py="xl">
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
                {voters_length.find((item) => item.value === value)?.label ===
                -1 ? (
                  "Contact us"
                ) : (
                  <NumberFormatter
                    prefix="₱ "
                    value={
                      499 +
                      (voters_length.find((item) => item.value === value)
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
                {voters_length.find((item) => item.value === value)?.label ===
                -1 ? (
                  "Unlimited"
                ) : (
                  <NumberFormatter
                    value={
                      voters_length.find((item) => item.value === value)?.label
                    }
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
                  voters_length.find((item) => item.value === value)?.label ===
                  -1 ? (
                    "Unlimited"
                  ) : (
                    <NumberFormatter
                      value={
                        voters_length.find((item) => item.value === value)
                          ?.label
                      }
                      thousandSeparator
                    />
                  )
                }
                marks={voters_length.map((item) => ({
                  value: item.value,
                  // label: item.label === -1 ? "Unlimited" : item.label,
                }))}
              />
              <Text fz="lg" fw={600} mt="lg" mb="xs">
                Key Features
              </Text>

              <List
                spacing="xs"
                size="sm"
                center
                icon={
                  <ThemeIcon variant="gradient" size={24} radius="xl">
                    <IconCircleCheck
                      style={{ width: rem(16), height: rem(16) }}
                    />
                  </ThemeIcon>
                }
              >
                <ListItem>Ad-Free</ListItem>
                <ListItem>Realtime Update</ListItem>
                <ListItem>No Watermark</ListItem>
              </List>
            </Box>
            <Button size="lg" radius="xl" variant="gradient" w="100%">
              Get Boost (Soon!)
            </Button>
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
                value={99}
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
            <Button
              w={{ base: "100%", md: "auto" }}
              size="lg"
              radius="xl"
              variant="outline"
              style={{ marginBottom: "auto" }}
            >
              Get Plus (Soon!)
            </Button>
          </Flex>
        </Flex>
      </Stack>

      <Box mt={128}>
        <Title ta="center">Compare</Title>
        <Text ta="center">
          <Balancer>
            Compare all features between Free and Boost to see which one is
            right for you.
          </Balancer>
        </Text>
        <Table.ScrollContainer minWidth={0}>
          <Table striped verticalSpacing="md">
            <Table.Thead>
              <Table.Tr>
                <Table.Th></Table.Th>
                <Table.Th>
                  <Title order={3}>Free</Title>
                  <Text>For a lifetime</Text>
                </Table.Th>
                <Table.Th>
                  <Title order={3}>Boost</Title>
                  <Text>Per Election</Text>
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody fz="md">
              <Table.Tr>
                <Table.Td>Price</Table.Td>
                <Table.Td>
                  <NumberFormatter
                    prefix="₱ "
                    value={0}
                    fixedDecimalScale
                    decimalScale={2}
                  />
                </Table.Td>
                <Table.Td fw="bold">
                  {voters_length.find((item) => item.value === value)?.label ===
                  -1 ? (
                    "Contact us"
                  ) : (
                    <NumberFormatter
                      prefix="₱ "
                      value={
                        499 +
                        (voters_length.find((item) => item.value === value)
                          ?.price_added ?? 0)
                      }
                      fixedDecimalScale
                      decimalScale={2}
                    />
                  )}
                </Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>Number of Voters</Table.Td>
                <Table.Td>Up to 500</Table.Td>
                <Table.Td fw="bold">
                  {voters_length.find((item) => item.value === value)?.label ===
                  -1 ? (
                    "Unlimited"
                  ) : (
                    <>
                      Up to{" "}
                      <NumberFormatter
                        value={
                          voters_length.find((item) => item.value === value)
                            ?.label
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
                      voters_length.find((item) => item.value === value)
                        ?.label === -1 ? (
                        "Unlimited"
                      ) : (
                        <NumberFormatter
                          value={
                            voters_length.find((item) => item.value === value)
                              ?.label
                          }
                          thousandSeparator
                        />
                      )
                    }
                    marks={voters_length.map((item) => ({
                      value: item.value,
                      // label: item.label === -1 ? "Unlimited" : item.label,
                    }))}
                  />
                </Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>Ad-Free</Table.Td>
                <Table.Td>
                  <ThemeIcon variant="default" size={24} radius="xl">
                    <IconCircleX style={{ width: rem(16), height: rem(16) }} />
                  </ThemeIcon>
                </Table.Td>
                <Table.Td>
                  <ThemeIcon variant="gradient" size={24} radius="xl">
                    <IconCircleCheck
                      style={{ width: rem(16), height: rem(16) }}
                    />
                  </ThemeIcon>
                </Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>Result Realtime Update</Table.Td>
                <Table.Td>Every hour</Table.Td>
                <Table.Td fw="bold">Every second</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>Watermark</Table.Td>
                <Table.Td>
                  <ThemeIcon variant="default" size={24} radius="xl">
                    <IconCircleX style={{ width: rem(16), height: rem(16) }} />
                  </ThemeIcon>
                </Table.Td>
                <Table.Td>
                  <ThemeIcon variant="gradient" size={24} radius="xl">
                    <IconCircleCheck
                      style={{ width: rem(16), height: rem(16) }}
                    />
                  </ThemeIcon>
                </Table.Td>
              </Table.Tr>
            </Table.Tbody>
            <Table.Tfoot>
              <Table.Tr
                styles={{
                  tr: {
                    borderBottomWidth: 0,
                  },
                }}
              >
                <Table.Td></Table.Td>
                <Table.Td>
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
                </Table.Td>
                <Table.Td>
                  <Button w="100%" radius="xl" size="lg" variant="gradient">
                    Get Boost (Soon!)
                  </Button>
                </Table.Td>
              </Table.Tr>
            </Table.Tfoot>
          </Table>
        </Table.ScrollContainer>
      </Box>
    </Container>
  );
}
