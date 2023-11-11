"use client";

import Image from "next/image";
import Link from "next/link";
import ScrollToTopButton from "@/components/client/components/scroll-to-top";
import { api } from "@/trpc/client";
import {
  Box,
  Button,
  Center,
  Container,
  Flex,
  Group,
  Loader,
  NumberFormatter,
  SimpleGrid,
  Stack,
  Table,
  TableTbody,
  TableTd,
  TableTh,
  TableThead,
  TableTr,
  Text,
  Title,
} from "@mantine/core";
import { IconFingerprint } from "@tabler/icons-react";
import moment from "moment";
import Balancer from "react-wrap-balancer";

import type { RouterOutputs } from "@eboto-mo/api";
import { isElectionEnded, parseHourTo12HourFormat } from "@eboto-mo/constants";
import type { Election } from "@eboto-mo/db/schema";

export default function Realtime({
  positions,
  election,
}: {
  positions: RouterOutputs["election"]["getElectionRealtime"];
  election: Election;
}) {
  const positionsQuery = api.election.getElectionRealtime.useQuery(
    election.slug,
    {
      initialData: positions,
    },
  );
  const getVoterFieldsStatsInRealtimeQuery =
    api.election.getVoterFieldsStatsInRealtime.useQuery({
      election_id: election.id,
    });
  const isEnded = isElectionEnded({ election });
  return (
    <>
      <ScrollToTopButton />
      <Container py="xl" size="md">
        <Stack gap="xl">
          <Center>
            <Stack>
              <Box>
                <Group justify="center" mb={8}>
                  {election.logo ? (
                    <Image
                      src={election.logo.url}
                      alt="Logo"
                      width={92}
                      height={92}
                      priority
                    />
                  ) : (
                    <IconFingerprint size={92} style={{ padding: 8 }} />
                  )}
                </Group>
                <Title order={2} style={{ lineClamp: 2 }} ta="center">
                  {election.name} (@{election.slug})
                </Title>
                <Text ta="center">
                  {moment(election.start_date).format("MMMM D, YYYY hA")}
                  {" - "}
                  {moment(election.end_date).format("MMMM D, YYYY hA")}
                </Text>
                <Text ta="center">
                  Voting hours:{" "}
                  {election.voting_hour_start === 0 &&
                  election.voting_hour_end === 24
                    ? "Whole day"
                    : parseHourTo12HourFormat(election.voting_hour_start) +
                      " - " +
                      parseHourTo12HourFormat(election.voting_hour_end)}
                </Text>

                {!isEnded ? (
                  <Text ta="center" size="xs" c="dimmed">
                    <Balancer>
                      Realtime result as of{" "}
                      {moment(new Date()).format("MMMM Do YYYY, h:mm:ss A")}
                    </Balancer>
                  </Text>
                ) : (
                  <Text ta="center" tw="bold">
                    Official result as of{" "}
                    {moment(new Date()).format("MMMM Do YYYY, h:mm:ss A")}
                  </Text>
                )}
              </Box>
              <Center>
                <Button
                  component={Link}
                  href={`/${election.slug}`}
                  radius="xl"
                  variant="outline"
                  size="md"
                >
                  Election Page
                </Button>
              </Center>
            </Stack>
          </Center>

          <Stack gap="xl">
            <SimpleGrid
              cols={{
                base: 1,
                xs: 2,
                sm: 3,
              }}
              spacing={{
                base: "lg",
                xs: "md",
              }}
            >
              {positionsQuery.data.map((position) => (
                <Table
                  key={position.id}
                  highlightOnHover
                  withTableBorder
                  withColumnBorders
                  captionSide="bottom"
                  h="fit-content"
                >
                  {/* TODO: Getting a hydration error */}
                  {/* <TableCaption>
                    {!isEnded &&
                      ` As of ${moment(new Date()).format(
                        "MMMM Do YYYY, h:mm:ss A",
                      )}`}
                  </TableCaption> */}
                  <TableThead>
                    <TableTr>
                      <TableTh>
                        <Text lineClamp={2} fw="bold">
                          {position.name}
                        </Text>
                      </TableTh>
                    </TableTr>
                  </TableThead>

                  <TableTbody>
                    {position.candidates
                      .sort((a, b) => b.vote - a.vote)
                      .map((candidate) => (
                        <TableTr key={candidate.id}>
                          <TableTd>
                            <Flex justify="space-between" align="center">
                              <Text lineClamp={2}>{candidate.name}</Text>
                              <Text>
                                <NumberFormatter
                                  thousandSeparator
                                  value={candidate.vote}
                                />
                              </Text>
                            </Flex>
                          </TableTd>
                        </TableTr>
                      ))}
                    <TableTr>
                      <TableTd>
                        <Flex justify="space-between" align="center">
                          <Text>Abstain</Text>
                          <Text>
                            <NumberFormatter
                              thousandSeparator
                              value={position.votes}
                            />
                          </Text>
                        </Flex>
                      </TableTd>
                    </TableTr>
                  </TableTbody>
                </Table>
              ))}
            </SimpleGrid>
            <Stack gap="sm">
              <Title order={3} ta="center">
                Voter Stats
              </Title>
              {getVoterFieldsStatsInRealtimeQuery.isLoading ? (
                <Center>
                  <Loader size="sm" />
                </Center>
              ) : !getVoterFieldsStatsInRealtimeQuery.data ||
                getVoterFieldsStatsInRealtimeQuery.data.length === 0 ? (
                <Text>No voter stats</Text>
              ) : (
                <SimpleGrid
                  cols={{
                    base: 1,
                    md: 2,
                  }}
                  style={{
                    alignItems: "start",
                  }}
                >
                  {getVoterFieldsStatsInRealtimeQuery.data.map(
                    (voterFieldStat) => (
                      <Table
                        key={voterFieldStat.name}
                        withColumnBorders
                        withTableBorder
                      >
                        <TableThead>
                          <TableTr>
                            <TableTh>{voterFieldStat.name}</TableTh>
                            <TableTh>Voted</TableTh>
                          </TableTr>
                        </TableThead>
                        <TableTbody>
                          {voterFieldStat.options.length ? (
                            voterFieldStat.options.map((option) => (
                              <TableTr key={option.name}>
                                <TableTd>{option.name}</TableTd>
                                <TableTd>
                                  <NumberFormatter
                                    thousandSeparator
                                    value={option.vote_count}
                                  />
                                </TableTd>
                              </TableTr>
                            ))
                          ) : (
                            <TableTr>
                              <TableTd>
                                <Text>No answer yet</Text>
                              </TableTd>
                            </TableTr>
                          )}
                        </TableTbody>
                      </Table>
                    ),
                  )}
                </SimpleGrid>
              )}
            </Stack>
          </Stack>
        </Stack>
      </Container>
    </>
  );
}
