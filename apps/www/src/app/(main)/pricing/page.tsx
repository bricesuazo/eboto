"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Box,
  Button,
  Container,
  NumberFormatter,
  rem,
  Slider,
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
import { IconCircleCheck, IconCircleX } from "@tabler/icons-react";
import Balancer from "react-wrap-balancer";

import { PRICING } from "@eboto/constants";

import { GetBoostButton } from "~/components/get-boost-button";
import { MainPricing } from "~/components/main-pricing";
import ElectionBoost from "~/components/modals/election-boost";

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
