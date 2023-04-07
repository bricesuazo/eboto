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
} from "@mantine/core";
import { useRouter } from "next/router";
import Moment from "react-moment";
import { convertNumberToHour } from "../../../utils/convertNumberToHour";
import { api } from "../../../utils/api";
import { IconExternalLink } from "@tabler/icons-react";
import Link from "next/link";
import { IconFlag, IconReplace, IconUserSearch } from "@tabler/icons-react";
import Head from "next/head";

const DashboardOverview = () => {
  const router = useRouter();

  const electionOverview = api.election.getElectionOverview.useQuery(
    router.query.electionSlug as string,
    {
      enabled: router.isReady,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: false,
    }
  );

  return (
    <>
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
          </Stack>
        </>
      )}
    </>
  );
};

export default DashboardOverview;
