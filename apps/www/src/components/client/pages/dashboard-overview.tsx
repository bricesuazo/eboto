"use client";

import Link from "next/link";
import GenerateResultRow from "@/components/client/components/generated-result-row";
import DashboardShowQRCode from "@/components/client/modals/dashboard-show-qr-code";
import { api } from "@/trpc/client";
import {
  ActionIcon,
  Box,
  Center,
  Flex,
  Loader,
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
  UnstyledButton,
} from "@mantine/core";
import {
  IconExternalLink,
  IconFlag,
  IconReplace,
  IconUserSearch,
} from "@tabler/icons-react";
import moment from "moment";

import type { RouterOutputs } from "@eboto-mo/api";

export default function DashboardOverview({
  data,
  election_slug,
}: {
  data: RouterOutputs["election"]["getDashboardOverviewData"];
  election_slug: string;
}) {
  const { data: election } = api.election.getDashboardOverviewData.useQuery(
    {
      election_slug,
    },
    { initialData: data },
  );
  const getVoterFieldsStatsQuery = api.election.getVoterFieldsStats.useQuery({
    election_id: data.id,
  });
  return (
    <Stack>
      <Box>
        <Flex justify="space-between" gap="xs">
          <Flex gap="xs">
            <Title order={2} style={{ lineClamp: 1 }}>
              {election.name} (@{election.slug})
            </Title>
            <ActionIcon
              variant="subtle"
              component={Link}
              href={`/${election.slug}`}
              target="_blank"
              radius="50%"
              size="lg"
            >
              <IconExternalLink size="1rem" />
            </ActionIcon>
          </Flex>
          <DashboardShowQRCode election={election} />
        </Flex>
        <Text>
          {moment(election.start_date)
            .local()
            .format("MMMM DD, YYYY hA (dddd)")}
          {" - "}
          {moment(election.end_date).local().format("MMMM DD, YYYY hA (dddd)")}
        </Text>
        <Text>
          Created:{" "}
          {moment(election.created_at).local().format("MMMM DD, YYYY hA")} (
          {moment(election.created_at).fromNow()})
        </Text>
        <Text>
          Publicity:{" "}
          {election.publicity.charAt(0) +
            election.publicity.slice(1).toLowerCase()}
        </Text>
      </Box>

      <Flex
        direction={{
          base: "column",
          md: "row",
        }}
        style={{
          borderRadius: "var(--mantine-radius-md)",
          overflow: "hidden",
          backgroundColor: "var(--mantine-color-gray-light)",
        }}
      >
        {[
          {
            id: 0,
            count: election.partylists.length.toString(),
            title: "Partylists",
            icon: IconFlag,
            href: "partylist",
          },
          {
            id: 1,
            count: election.positions.length.toString(),
            title: "Positions",
            icon: IconReplace,
            href: "position",
          },
          {
            id: 2,
            count: election.candidates.length.toString(),
            title: "Candidates",
            icon: IconUserSearch,
            href: "candidate",
          },
        ].map((stat) => {
          return (
            <UnstyledButton
              key={stat.id}
              component={Link}
              href={`/dashboard/${election.slug}/${stat.href}`}
              style={{
                display: "flex",
                alignItems: "center",
                columnGap: "var(--mantine-spacing-md)",
                padding: "var(--mantine-spacing-md)",
                flex: 1,
              }}
            >
              <Box>
                <stat.icon size="2rem" />
              </Box>
              <Box>
                <Title>{stat.count}</Title>
                <Text tt="uppercase" fw={700} c="green">
                  {stat.title}
                </Text>
              </Box>
            </UnstyledButton>
          );
        })}
      </Flex>

      <Flex
        direction={{
          base: "column",
          md: "row",
        }}
        style={{
          borderRadius: "var(--mantine-radius-md)",
          overflow: "hidden",
          backgroundColor: "var(--mantine-color-gray-light)",
        }}
      >
        {[
          {
            id: 0,
            count: `${
              election.voters.length === 0
                ? 0
                : election.voters.filter((voter) => voter.votes.length > 0)
                    .length
            } (${
              isNaN(
                (election.voters.filter((voter) => voter.votes.length > 0)
                  .length /
                  election.voters.length) *
                  100,
              )
                ? 0
                : (
                    (election.voters.filter((voter) => voter.votes.length > 0)
                      .length /
                      election.voters.length) *
                    100
                  ).toFixed(2)
            }%)`,
            title: "Voted",
            description: "Voters who already voted",
          },
          {
            id: 1,
            count: election.voters
              .filter((voter) => voter.votes.length > 0)
              .length.toString(),
            title: "Voters",
            description: "Voters",
          },
        ].map((stat) => {
          return (
            <Box
              key={stat.id}
              p="md"
              style={{
                flex: 1,
              }}
            >
              <Title order={2}>{stat.count}</Title>
              <Text tt="uppercase" fw={700} c="green">
                {stat.title}
              </Text>
              <Text fz="sm" c="dimmed">
                {stat.description}
              </Text>
            </Box>
          );
        })}
      </Flex>
      <Box>
        <Title
          order={3}
          // style={(theme) => ({
          //   [theme.fn.smallerThan("xs")]: {
          //     textAlign: "center",
          //   },
          // })}
        >
          Voter Stats
        </Title>
        {getVoterFieldsStatsQuery.isLoading ? (
          <Center>
            <Loader size="sm" />
          </Center>
        ) : !getVoterFieldsStatsQuery.data ||
          getVoterFieldsStatsQuery.data.length === 0 ? (
          <Text
          // style={(theme) => ({
          //   [theme.fn.smallerThan("xs")]: {
          //     textAlign: "center",
          //   },
          // })}
          >
            No voter stats
          </Text>
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
            {getVoterFieldsStatsQuery.data.map((voterFieldStat) => (
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
                      <TableTr key={option.id}>
                        <TableTd>{option.name}</TableTd>
                        <TableTd>{option.vote_count}</TableTd>
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
            ))}
          </SimpleGrid>
        )}
      </Box>
      <Box>
        <Title
          order={3}
          ta={{
            base: "center",
            xs: "left",
          }}
        >
          Generated Results
        </Title>

        <Box>
          {election.generated_election_results.length === 0 ? (
            <Text
              ta={{
                base: "center",
                xs: "left",
              }}
            >
              No generated results yet.
            </Text>
          ) : (
            election.generated_election_results.map((result) => (
              <GenerateResultRow key={result.id} result={result} />
            ))
          )}
        </Box>
      </Box>
    </Stack>
  );
}
