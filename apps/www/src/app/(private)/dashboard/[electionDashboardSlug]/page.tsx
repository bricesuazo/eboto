'use client';

import { use } from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import {
  ActionIcon,
  Box,
  Button,
  Center,
  Flex,
  Loader,
  Modal,
  NumberFormatter,
  SimpleGrid,
  Stack,
  Stepper,
  StepperStep,
  Table,
  TableTbody,
  TableTd,
  TableTh,
  TableThead,
  TableTr,
  Text,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';
import {
  IconCheckbox,
  IconCircleCheck,
  IconEdit,
  IconExternalLink,
  IconFingerprint,
  IconFlag,
  IconFlagCheck,
  IconListCheck,
  IconReplace,
  IconShield,
  IconShieldCheck,
  IconUserCheck,
  IconUsers,
  IconUserSearch,
  IconUserShield,
} from '@tabler/icons-react';
import moment from 'moment';
import ReactPlayer from 'react-player';

import { parseHourTo12HourFormat } from '@eboto/constants';

import CenterLoader from '~/components/center-loader';
import GenerateResultRow from '~/components/generated-result-row';
import DashboardShowQRCode from '~/components/modals/dashboard-show-qr-code';
import { api } from '~/trpc/client';

export default function Page({
  params,
}: {
  params: Promise<{ electionDashboardSlug: string }>;
}) {
  const { electionDashboardSlug } = use(params);

  const getDashboardOverviewDataQuery =
    api.election.getDashboardOverviewData.useQuery(
      {
        election_slug: electionDashboardSlug,
      },
      {
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
    );

  const getVoterFieldsStatsQuery = api.election.getVoterFieldsStats.useQuery(
    {
      election_id: getDashboardOverviewDataQuery.data?.id ?? '',
    },
    {
      enabled: !!getDashboardOverviewDataQuery.data,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  );
  const getElectionProgressQuery = api.election.getElectionProgress.useQuery(
    {
      election_id: getDashboardOverviewDataQuery.data?.id ?? '',
    },
    {
      enabled: !!getDashboardOverviewDataQuery.data,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  );

  const [value, setValue] = useLocalStorage<boolean>({
    key: `${electionDashboardSlug}_show_commissioner_tutorial`,
    defaultValue: true,
  });

  const election = getDashboardOverviewDataQuery.data;

  if (getDashboardOverviewDataQuery.isPending || !election) {
    return <CenterLoader />;
  }

  return (
    <>
      <Modal
        opened={value}
        onClose={() => setValue(false)}
        title="Commissioner Tutorial"
        size="lg"
        closeOnClickOutside={false}
      >
        <Stack>
          <Box style={{ aspectRatio: 16 / 9 }}>
            <ReactPlayer
              src="https://www.youtube.com/watch?v=mfSCYzL5_LU"
              width="100%"
              height="100%"
              controls
            />
          </Box>

          <Button w="100%" onClick={() => setValue(false)}>
            Close
          </Button>
        </Stack>
      </Modal>

      <Stack>
        <Stepper active={getElectionProgressQuery.data ?? 0}>
          <StepperStep
            icon={<IconEdit />}
            completedIcon={<IconCheckbox />}
            label="Step 1"
            description="Prepare election"
            loading={getElectionProgressQuery.isPending}
          />
          <StepperStep
            icon={<IconFlag />}
            completedIcon={<IconFlagCheck />}
            label="Step 2"
            description="Add partylist"
            loading={getElectionProgressQuery.isPending}
          />
          <StepperStep
            icon={<IconReplace />}
            completedIcon={<IconListCheck />}
            label="Step 3"
            description="Add positions"
            loading={getElectionProgressQuery.isPending}
          />
          <StepperStep
            icon={<IconUserSearch />}
            completedIcon={<IconUserCheck />}
            label="Step 4"
            description="Add candidates"
            loading={getElectionProgressQuery.isPending}
          />
          <StepperStep
            icon={<IconUsers />}
            completedIcon={<IconUserShield />}
            label="Step 5"
            description="Add voters"
            loading={getElectionProgressQuery.isPending}
          />
          <StepperStep
            icon={<IconCircleCheck />}
            completedIcon={<IconFingerprint />}
            label="Step 6"
            description="Voting period"
            loading={getElectionProgressQuery.isPending}
          />
          <StepperStep
            icon={<IconShield />}
            completedIcon={<IconShieldCheck />}
            label="Step 7"
            description="Election results"
            loading={getElectionProgressQuery.isPending}
          />
        </Stepper>
        <Box>
          <Flex justify="space-between" gap="xs">
            <Flex gap="xs">
              <Title order={2} style={{ lineClamp: 1 }}>
                {election.name} (@
                {election.slug})
              </Title>
              <ActionIcon
                variant="subtle"
                component={Link}
                href={`/${election.slug}` as Route}
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
            {moment(election.start_date).local().format('MMMM DD, YYYY')}
            {' - '}
            {moment(election.end_date).local().format('MMMM DD, YYYY')}
          </Text>
          <Text>
            Voting hours:{' '}
            {election.voting_hour_start === 0 && election.voting_hour_end === 24
              ? 'Whole day'
              : parseHourTo12HourFormat(election.voting_hour_start) +
                ' - ' +
                parseHourTo12HourFormat(election.voting_hour_end)}
          </Text>
          <Text>
            Created:{' '}
            {moment(election.created_at).local().format('MMMM DD, YYYY')} (
            {moment(election.created_at).fromNow()})
          </Text>
          <Text>
            Publicity:{' '}
            {election.publicity.charAt(0) +
              election.publicity.slice(1).toLowerCase()}
          </Text>
        </Box>

        <Flex
          direction={{
            base: 'column',
            md: 'row',
          }}
          style={{
            borderRadius: 'var(--mantine-radius-md)',
            overflow: 'hidden',
            backgroundColor: 'var(--mantine-color-gray-light)',
          }}
        >
          {[
            {
              id: 0,
              count: election.partylists.length,
              title: 'Partylists',
              icon: IconFlag,
              href: 'partylist',
            },
            {
              id: 1,
              count: election.positions.length,
              title: 'Positions',
              icon: IconReplace,
              href: 'position',
            },
            {
              id: 2,
              count: election.candidates.length,
              title: 'Candidates',
              icon: IconUserSearch,
              href: 'candidate',
            },
          ].map((stat) => (
            <UnstyledButton
              key={stat.id}
              component={Link}
              href={`/dashboard/${election.slug}/${stat.href}` as Route}
              style={{
                display: 'flex',
                alignItems: 'center',
                columnGap: 'var(--mantine-spacing-md)',
                padding: 'var(--mantine-spacing-md)',
                flex: 1,
              }}
            >
              <Box>
                <stat.icon size="2rem" />
              </Box>
              <Box>
                <Title>
                  <NumberFormatter thousandSeparator value={stat.count} />
                </Title>
                <Text tt="uppercase" fw={700} c="green">
                  {stat.title}
                </Text>
              </Box>
            </UnstyledButton>
          ))}
        </Flex>

        <Flex
          direction={{
            base: 'column',
            md: 'row',
          }}
          style={{
            borderRadius: 'var(--mantine-radius-md)',
            overflow: 'hidden',
            backgroundColor: 'var(--mantine-color-gray-light)',
          }}
        >
          {[
            {
              id: 0,
              count: election.voters.filter((voter) => voter.votes.length > 0)
                .length,
              sub_count:
                (election.voters.filter((voter) => voter.votes.length > 0)
                  .length /
                  election.voters.length) *
                100,
              title: 'Voted',
              description: 'Total number of voters who already voted',
            },
            {
              id: 1,
              count: election.voters.length,
              title: 'Voters',
              description: 'Total number of voters',
            },
          ].map((stat) => (
            <Box
              key={stat.id}
              p="md"
              style={{
                flex: 1,
              }}
            >
              <Title order={2}>
                <NumberFormatter thousandSeparator value={stat.count} />{' '}
                {stat.sub_count !== undefined &&
                  (stat.sub_count > 0 ? (
                    <>
                      (
                      <NumberFormatter
                        thousandSeparator
                        decimalScale={2}
                        fixedDecimalScale
                        value={stat.sub_count}
                        suffix="%"
                      />
                      )
                    </>
                  ) : (
                    '(0%)'
                  ))}
              </Title>
              <Text tt="uppercase" fw={700} c="green">
                {stat.title}
              </Text>
              <Text fz="sm" c="dimmed">
                {stat.description}
              </Text>
            </Box>
          ))}
        </Flex>
        <Box>
          <Title order={3}>Voter Stats</Title>
          {getVoterFieldsStatsQuery.isPending ? (
            <Center>
              <Loader size="sm" />
            </Center>
          ) : !getVoterFieldsStatsQuery.data ||
            getVoterFieldsStatsQuery.data.length === 0 ? (
            <Text>No voter stats</Text>
          ) : (
            <SimpleGrid
              cols={{
                base: 1,
                sm: 2,
                md: 1,
                lg: 2,
                xl: 3,
              }}
              style={{
                alignItems: 'start',
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
                        <TableTr key={option.name}>
                          <TableTd>
                            {option.name.length
                              ? option.name
                              : 'No answer yet...'}
                          </TableTd>
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
              ))}
            </SimpleGrid>
          )}
        </Box>
        <Box>
          <Title
            order={3}
            ta={{
              base: 'center',
              xs: 'left',
            }}
          >
            Generated Results
          </Title>

          <Box>
            {election.generated_election_results.length === 0 ? (
              <Text
                ta={{
                  base: 'center',
                  xs: 'left',
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
    </>
  );
}
