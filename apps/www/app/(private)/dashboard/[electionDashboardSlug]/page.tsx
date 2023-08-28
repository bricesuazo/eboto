import GenerateResultRow from "@/components/client/components/generated-result-row";
import DashboardShowQRCode from "@/components/client/modals/dashboard-show-qr-code";
import { db } from "@eboto-mo/db";
import {
  ActionIcon,
  Box,
  Flex,
  Stack,
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
import { not } from "drizzle-orm";
import moment from "moment";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Overview",
};

export default async function Page({
  params: { electionDashboardSlug },
}: {
  params: { electionDashboardSlug: string };
}) {
  // const election = await electionCaller.getElectionBySlug({
  //   slug: electionDashboardSlug,
  // });

  const election = await db.query.elections.findFirst({
    where: (elections, { eq }) => eq(elections.slug, electionDashboardSlug),
    with: {
      positions: true,
      partylists: {
        where: (partylist, { eq }) => not(eq(partylist.acronym, "IND")),
      },
      voters: {
        with: {
          votes: true,
        },
      },
      invited_voters: true,
      generated_election_results: true,
      candidates: true,
    },
  });

  if (!election) notFound();

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
            title: "Accepted Voters",
            description: "Voters who accepted the invitation to vote",
          },
          {
            id: 2,
            count: election.invited_voters
              .filter((invited_voter) => invited_voter.status === "INVITED")
              .length.toString(),
            title: "Invited Voters",
            description: "Voters who were invited to vote",
          },
          {
            id: 3,
            count: election.invited_voters
              .filter((invited_voter) => invited_voter.status === "DECLINED")
              .length.toString(),
            title: "Declined Voters",
            description: "Voters who declined the invitation to vote",
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
      {/* <Box>
        <Title
          order={3}
          style={(theme) => ({
            [theme.fn.smallerThan("xs")]: {
              textAlign: "center",
            },
          })}
        >
          Voter Stats
        </Title>
        {voterFieldsStats.isLoading ? (
          <Center>
            <Loader size="sm" />
          </Center>
        ) : !voterFieldsStats.data || voterFieldsStats.data.length === 0 ? (
          <Text
            style={(theme) => ({
              [theme.fn.smallerThan("xs")]: {
                textAlign: "center",
              },
            })}
          >
            No voter stats
          </Text>
        ) : (
          <SimpleGrid
            cols={2}
            style={{
              alignItems: "start",
            }}
            breakpoints={[
              {
                maxWidth: "md",
                cols: 1,
              },
            ]}
          >
            {voterFieldsStats.data.map((voterFieldStat) => (
              <Table
                key={voterFieldStat.fieldName}
                striped
                highlightOnHover
                withBorder
                withColumnBorders
              >
                <thead>
                  <tr>
                    <th>{voterFieldStat.fieldName}</th>
                    <th>Voted</th>
                    <th>Voter (Accepted)</th>
                    <th>Voter (Invited)</th>
                  </tr>
                </thead>
                <tbody>
                  {voterFieldStat.fields.map((field) => (
                    <tr key={field.fieldValue}>
                      <td>{field.fieldValue}</td>
                      <td>{field.voteCount}</td>
                      <td>{field.allCountAccepted}</td>
                      <td>{field.allCountInvited}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ))}
          </SimpleGrid>
        )}
      </Box> */}
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
