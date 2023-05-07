import {
  Text,
  Title,
  Flex,
  ActionIcon,
  Box,
  Stack,
  UnstyledButton,
  rem,
  Center,
  Loader,
  Group,
  Button,
  Table,
  SimpleGrid,
} from "@mantine/core";
import { useRouter } from "next/router";
import Moment from "react-moment";
import { convertNumberToHour } from "../../../utils/convertNumberToHour";
import { api } from "../../../utils/api";
import { IconDownload, IconExternalLink } from "@tabler/icons-react";
import Link from "next/link";
import { IconFlag, IconReplace, IconUserSearch } from "@tabler/icons-react";
import Head from "next/head";
import type { GeneratedElectionResult } from "@prisma/client";
import { supabase } from "../../../lib/supabase";
import { useState } from "react";

const DashboardOverview = () => {
  const router = useRouter();

  const generateResults = api.election.getAllGeneratedResults.useQuery(
    {
      slug: router.query.electionSlug as string,
    },
    {
      enabled: router.isReady,
    }
  );

  const electionOverview = api.election.getElectionOverview.useQuery(
    router.query.electionSlug as string,
    {
      enabled: router.isReady,
    }
  );
  const voterFieldsStats = api.voter.getFieldsStats.useQuery(
    { electionSlug: router.query.electionSlug as string },
    {
      enabled: router.isReady,
    }
  );

  return (
    <>
      <Head>
        <title>Overview | eBoto Mo</title>
      </Head>
      {electionOverview.isLoading ? (
        <Center h="100%">
          <Loader size="lg" />
        </Center>
      ) : electionOverview.isError ? (
        <Text>Error: {electionOverview.error.message}</Text>
      ) : !electionOverview.data ? (
        <Text>No election found</Text>
      ) : (
        <>
          <Head>
            <title>
              {electionOverview.data.election.name} &ndash; Overview | eBoto Mo
            </title>
          </Head>
          <Stack p="md">
            <Box>
              <Flex align="center" gap="sm">
                <Title order={2}>
                  {`${electionOverview.data.election.name} (@${electionOverview.data.election.slug})`}
                </Title>
                <ActionIcon
                  component={Link}
                  href={`/${electionOverview.data.election.slug}`}
                  target="_blank"
                  sx={(theme) => ({
                    borderRadius: "50%",
                    width: 34,
                    height: 34,
                    padding: theme.radius.xs,
                  })}
                >
                  <IconExternalLink size={rem(18)} />
                </ActionIcon>
              </Flex>
              <Text>
                <Moment
                  format="MMMM DD, YYYY"
                  date={electionOverview.data.election.start_date}
                />
                {" - "}
                <Moment
                  format="MMMM DD, YYYY"
                  date={electionOverview.data.election.end_date}
                />
              </Text>
              <Text>
                Open from{" "}
                {convertNumberToHour(
                  electionOverview.data.election.voting_start
                )}{" "}
                to{" "}
                {convertNumberToHour(electionOverview.data.election.voting_end)}
              </Text>
              <Text>
                Created:{" "}
                <Moment
                  format="MMMM DD, YYYY hh:mmA"
                  date={electionOverview.data.election.createdAt}
                />{" "}
                (
                <Moment
                  fromNow
                  interval={1000}
                  date={electionOverview.data.election.createdAt}
                />
                )
              </Text>
              <Text>
                Publicity:{" "}
                {electionOverview.data.election.publicity.charAt(0) +
                  electionOverview.data.election.publicity
                    .slice(1)
                    .toLowerCase()}
              </Text>
            </Box>

            <Box
              sx={(theme) => ({
                display: "flex",

                borderRadius: theme.radius.md,
                backgroundColor:
                  theme.colorScheme === "dark"
                    ? theme.colors.dark[6]
                    : theme.colors.gray[1],
                // overflow: "hidden",

                [theme.fn.smallerThan("sm")]: {
                  flexDirection: "column",
                },
              })}
            >
              {[
                {
                  id: 0,
                  count: (
                    electionOverview.data.partylists._count._all - 1
                  ).toString(),
                  title: "Partylists",
                  icon: IconFlag,
                  href: "partylist",
                },
                {
                  id: 1,
                  count: electionOverview.data.positions._count._all.toString(),
                  title: "Positions",
                  icon: IconReplace,
                  href: "position",
                },
                {
                  id: 2,
                  count:
                    electionOverview.data.candidates._count._all.toString(),
                  title: "Candidates",
                  icon: IconUserSearch,
                  href: "candidate",
                },
              ].map((stat) => {
                return (
                  <UnstyledButton
                    key={stat.id}
                    component={Link}
                    href={`/dashboard/${electionOverview.data.election.slug}/${stat.href}`}
                    sx={(theme) => ({
                      display: "flex",
                      alignItems: "center",
                      columnGap: theme.spacing.md,
                      padding: theme.spacing.md,
                      flex: 1,

                      borderStartStartRadius:
                        stat.id === 0 ? theme.radius.md : 0,
                      borderStartEndRadius: stat.id === 2 ? theme.radius.md : 0,
                      borderEndStartRadius: stat.id === 0 ? theme.radius.md : 0,
                      borderEndEndRadius: stat.id === 2 ? theme.radius.md : 0,

                      [theme.fn.smallerThan("sm")]: {
                        borderStartStartRadius:
                          stat.id === 0 ? theme.radius.md : 0,
                        borderStartEndRadius:
                          stat.id === 0 ? theme.radius.md : 0,
                        borderEndStartRadius:
                          stat.id === 2 ? theme.radius.md : 0,
                        borderEndEndRadius: stat.id === 2 ? theme.radius.md : 0,
                      },

                      "&:hover": {
                        backgroundColor:
                          theme.colorScheme === "dark"
                            ? theme.colors.dark[5]
                            : theme.colors.gray[2],
                      },
                    })}
                  >
                    <Box>
                      <stat.icon size="2rem" />
                    </Box>
                    <Box>
                      <Title>{stat.count}</Title>
                      <Text
                        sx={(theme) => ({
                          textTransform: "uppercase",
                          fontWeight: 700,
                          color: theme.primaryColor,
                        })}
                      >
                        {stat.title}
                      </Text>
                    </Box>
                  </UnstyledButton>
                );
              })}
            </Box>

            <Box
              sx={(theme) => ({
                display: "flex",
                borderRadius: theme.radius.md,
                backgroundColor:
                  theme.colorScheme === "dark"
                    ? theme.colors.dark[6]
                    : theme.colors.gray[1],
                overflow: "hidden",

                [theme.fn.smallerThan("sm")]: {
                  flexDirection: "column",
                },
              })}
            >
              {[
                {
                  id: 0,
                  count: `${electionOverview.data.voted._count._all} (${
                    isNaN(
                      (electionOverview.data.voted._count._all /
                        electionOverview.data.voters._count._all) *
                        100
                    )
                      ? 0
                      : (
                          (electionOverview.data.voted._count._all /
                            electionOverview.data.voters._count._all) *
                          100
                        ).toFixed(0)
                  }%)`,
                  title: "Voted",
                  description: "Voters who already voted",
                },
                {
                  id: 1,
                  count: electionOverview.data.voters._count._all.toString(),
                  title: "Accepted Voters",
                  description: "Voters who accepted the invitation to vote",
                },
                {
                  id: 2,
                  count:
                    electionOverview.data.invitedVoters._count._all.toString(),
                  title: "Invited Voters",
                  description: "Voters who were invited to vote",
                },
                {
                  id: 3,
                  count:
                    electionOverview.data.declinedVoters._count._all.toString(),
                  title: "Declined Voters",
                  description: "Voters who declined the invitation to vote",
                },
              ].map((stat) => {
                return (
                  <Box
                    key={stat.id}
                    sx={(theme) => ({
                      flex: 1,
                      padding: theme.spacing.md,

                      "&:hover": {
                        backgroundColor:
                          theme.colorScheme === "dark"
                            ? theme.colors.dark[5]
                            : theme.colors.gray[2],
                      },
                    })}
                  >
                    <Title order={2}>{stat.count}</Title>
                    <Text
                      sx={(theme) => ({
                        textTransform: "uppercase",
                        fontWeight: 700,
                        color: theme.primaryColor,
                      })}
                    >
                      {stat.title}
                    </Text>
                    <Text
                      sx={(theme) => ({
                        color:
                          theme.colorScheme === "dark"
                            ? theme.colors.dark[2]
                            : theme.colors.gray[6],
                        fontSize: theme.fontSizes.sm,
                      })}
                    >
                      {stat.description}
                    </Text>
                  </Box>
                );
              })}
            </Box>
            <Box>
              <Title
                order={3}
                sx={(theme) => ({
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
              ) : !voterFieldsStats.data ||
                voterFieldsStats.data.length === 0 ? (
                <Text>No voter stats</Text>
              ) : (
                <SimpleGrid
                  cols={2}
                  sx={{
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
            </Box>
            <Box>
              <Title
                order={3}
                sx={(theme) => ({
                  [theme.fn.smallerThan("xs")]: {
                    textAlign: "center",
                  },
                })}
              >
                Generated Results
              </Title>

              <Box>
                {electionOverview.isLoading ? (
                  <Text
                    sx={(theme) => ({
                      [theme.fn.smallerThan("xs")]: {
                        textAlign: "center",
                      },
                    })}
                  >
                    Loading...
                  </Text>
                ) : !generateResults.data ||
                  generateResults.data.length === 0 ? (
                  <Text
                    sx={(theme) => ({
                      [theme.fn.smallerThan("xs")]: {
                        textAlign: "center",
                      },
                    })}
                  >
                    No generated results yet.
                  </Text>
                ) : (
                  generateResults.data.map((result) => (
                    <GenerateResultRow result={result} key={result.id} />
                  ))
                )}
              </Box>
            </Box>
          </Stack>
        </>
      )}
    </>
  );
};

export default DashboardOverview;

const GenerateResultRow = ({ result }: { result: GeneratedElectionResult }) => {
  const [states, setStates] = useState<{
    isGenerating: boolean;
    error: string | null;
  }>({
    isGenerating: false,
    error: null,
  });

  return (
    <Group
      position="apart"
      align="center"
      sx={(theme) => ({
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,

        "&:hover": {
          backgroundColor:
            theme.colorScheme === "dark"
              ? theme.colors.dark[5]
              : theme.colors.gray[2],
        },
      })}
    >
      <Box>
        <Text>{result.name}</Text>
        <Text size="sm" color="dimmed">
          Generated{" "}
          <Moment date={new Date(result.createdAt).toLocaleString()} fromNow />{" "}
          (
          <Moment
            date={new Date(result.createdAt).toLocaleString()}
            format="MMMM DD, YYYY hh:mmA"
          />
          )
        </Text>
      </Box>
      <Button
        size="xs"
        leftIcon={<IconDownload size="1rem" />}
        loading={states.isGenerating}
        onClick={async () => {
          setStates({
            isGenerating: true,
            error: null,
          });

          const { data, error } = await supabase.storage
            .from("eboto-mo")
            .download(`elections/${result.electionId}/results/${result.name}`);

          if (error) {
            setStates({
              isGenerating: false,
              error: error.message,
            });
            return;
          }

          const url = URL.createObjectURL(data);

          const anchor = document.createElement("a");
          anchor.href = url;
          anchor.download = result.name;

          document.body.appendChild(anchor);

          anchor.click();

          document.body.removeChild(anchor);

          URL.revokeObjectURL(url);

          setStates({
            isGenerating: false,
            error: null,
          });
        }}
      >
        Download
      </Button>
    </Group>
  );
};
