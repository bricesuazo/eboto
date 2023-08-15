import QRCode from "@/components/client/modals/show-qr-code";
import { db } from "@eboto-mo/db";
import {
  ActionIcon,
  Box,
  Flex,
  Group,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconExternalLink } from "@tabler/icons-react";
import moment from "moment";
import Link from "next/link";
import { notFound } from "next/navigation";

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
  });

  if (!election) notFound();

  return (
    <Stack>
      <Box>
        <Group justify="space-between" align="center" gap="xs">
          <Group align="center" gap="xs">
            <Title order={2} style={{ lineClamp: 1 }}>
              {election.name} (@{election.slug})
            </Title>
            <ActionIcon
              variant="subtle"
              component={Link}
              href={`/${election.slug}`}
              target="_blank"
              radius="50%"
              w={40}
              h={40}
            >
              <IconExternalLink size="1rem" />
            </ActionIcon>
          </Group>
          <QRCode election={election} />
        </Group>
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
      // backgroundColor:
      //   theme.colorScheme === "dark"
      //     ? theme.colors.dark[6]
      //     : theme.colors.gray[1],
      // overflow: "hidden",

      // [theme.fn.smallerThan("sm")]: {
      //   flexDirection: "column",
      // },
      >
        {/* {[
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
            count: electionOverview.data.candidates._count._all.toString(),
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
              style={(theme) => ({
                display: "flex",
                alignItems: "center",
                columnGap: theme.spacing.md,
                padding: theme.spacing.md,
                flex: 1,

                borderStartStartRadius: stat.id === 0 ? theme.radius.md : 0,
                borderStartEndRadius: stat.id === 2 ? theme.radius.md : 0,
                borderEndStartRadius: stat.id === 0 ? theme.radius.md : 0,
                borderEndEndRadius: stat.id === 2 ? theme.radius.md : 0,

                [theme.fn.smallerThan("sm")]: {
                  borderStartStartRadius: stat.id === 0 ? theme.radius.md : 0,
                  borderStartEndRadius: stat.id === 0 ? theme.radius.md : 0,
                  borderEndStartRadius: stat.id === 2 ? theme.radius.md : 0,
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
                  style={(theme) => ({
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
        })} */}
      </Flex>

      {/* <Box
        style={(theme) => ({
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
            count: electionOverview.data.invitedVoters._count._all.toString(),
            title: "Invited Voters",
            description: "Voters who were invited to vote",
          },
          {
            id: 3,
            count: electionOverview.data.declinedVoters._count._all.toString(),
            title: "Declined Voters",
            description: "Voters who declined the invitation to vote",
          },
        ].map((stat) => {
          return (
            <Box
              key={stat.id}
              style={(theme) => ({
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
                style={(theme) => ({
                  textTransform: "uppercase",
                  fontWeight: 700,
                  color: theme.primaryColor,
                })}
              >
                {stat.title}
              </Text>
              <Text
                style={(theme) => ({
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
      </Box> */}
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
          // style={(theme) => ({
          //   [theme.fn.smallerThan("xs")]: {
          //     textAlign: "center",
          //   },
          // })}
        >
          Generated Results
        </Title>

        {/* <Box>
          {electionOverview.isLoading ? (
            <Text
              style={(theme) => ({
                [theme.fn.smallerThan("xs")]: {
                  textAlign: "center",
                },
              })}
            >
              Loading...
            </Text>
          ) : !generateResults.data || generateResults.data.length === 0 ? (
            <Text
              style={(theme) => ({
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
        </Box> */}
      </Box>
    </Stack>
  );
}
