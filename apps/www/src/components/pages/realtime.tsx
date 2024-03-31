"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import ScrollToTopButton from "@/components/scroll-to-top";
import { api } from "@/trpc/client";
import { Adsense } from "@ctrl/react-adsense";
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

import type { RouterOutputs } from "@eboto/api";
import {
  isElectionEnded,
  isElectionOngoing,
  parseHourTo12HourFormat,
} from "@eboto/constants";

import type { Database } from "../../../../../supabase/types";
import AdModal from "../ad-modal";
import MessageCommissioner from "../modals/message-commissioner";
import MyMessagesElection from "../my-messages-election";

const date = new Date();
const rounded_off_date = new Date();
rounded_off_date.setMinutes(0);
rounded_off_date.setSeconds(0);

export default function Realtime({
  positions,
  election,
  isVoterCanMessage,
}: {
  positions: RouterOutputs["election"]["getElectionRealtime"];
  election: Database["public"]["Tables"]["elections"]["Row"] & {
    logo_url: string | null;
    voter_fields: Database["public"]["Tables"]["voter_fields"]["Row"][];
    is_free: boolean;
  };
  isVoterCanMessage: boolean;
}) {
  const [time, setTime] = useState(!election.is_free ? date : rounded_off_date);
  const positionsQuery = api.election.getElectionRealtime.useQuery(
    election.slug,
    {
      refetchInterval: !election.is_free ? 1000 : false,
      initialData: positions,
      enabled: !election.is_free,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  );
  const getVoterFieldsStatsInRealtimeQuery =
    api.election.getVoterFieldsStatsInRealtime.useQuery(
      {
        election_id: election.id,
      },
      {
        enabled:
          isElectionOngoing({ election }) && election.voter_fields.length > 0,
        refetchInterval: !election.is_free ? 1000 : false,
        refetchOnMount: true,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
    );

  useEffect(() => {
    if (election.is_free) return;

    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, [election.is_free]);

  return (
    <>
      {election.is_free && <AdModal />}
      <ScrollToTopButton />
      {isVoterCanMessage && <MyMessagesElection election_id={election.id} />}

      <Container py="xl" size="md" mb={80}>
        <Stack gap="xl">
          <Center>
            <Stack>
              <Box>
                <Group justify="center" mb={8}>
                  {election.logo_url ? (
                    <Image
                      src={election.logo_url}
                      alt="Logo"
                      width={92}
                      height={92}
                      priority
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    <IconFingerprint size={92} style={{ padding: 8 }} />
                  )}
                </Group>
                <Title order={2} style={{ lineClamp: 2 }} ta="center">
                  {election.name} (@{election.slug})
                </Title>
                <Text ta="center">
                  {moment(election.start_date).format("MMMM D, YYYY")}
                  {" - "}
                  {moment(election.end_date).format("MMMM D, YYYY")}
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

                {isElectionEnded({ election }) ? (
                  <Text ta="center" tw="bold">
                    Official result
                  </Text>
                ) : (
                  <Text ta="center" size="xs" c="dimmed">
                    <Balancer>
                      Realtime result as of{" "}
                      {moment(time).format("MMMM Do YYYY, h:mm:ss A")}
                    </Balancer>
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
              {isVoterCanMessage && (
                <MessageCommissioner election_id={election.id} />
              )}
            </Stack>
          </Center>
          {election.is_free && (
            <Adsense
              style={{
                display: "block",
                width: "100%",
              }}
              client="ca-pub-8443325162715161"
              slot="6949415137"
              format="auto"
              responsive="true"
            />
          )}

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
              {positionsQuery.data.positions.map((position) => (
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

            {election.is_free && (
              <Adsense
                style={{
                  display: "block",
                  width: "100%",
                }}
                client="ca-pub-8443325162715161"
                slot="6949415137"
                format="auto"
                responsive="true"
              />
            )}

            {election.voter_fields.length > 0 && (
              <Stack gap="sm">
                <Title order={3} ta="center">
                  Voter Stats
                </Title>
                {getVoterFieldsStatsInRealtimeQuery.isPending ? (
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
            )}
          </Stack>
        </Stack>
      </Container>
    </>
  );
}
