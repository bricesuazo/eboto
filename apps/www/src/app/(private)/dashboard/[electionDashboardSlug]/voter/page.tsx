'use client';

import { use, useMemo, useState } from 'react';
import {
  ActionIcon,
  Alert,
  Box,
  Button,
  Flex,
  Group,
  Modal,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconDownload, IconInfoCircle, IconRefresh } from '@tabler/icons-react';
import type { MRT_ColumnDef, MRT_RowSelectionState } from 'mantine-react-table';
import {
  MantineReactTable,
  MRT_GlobalFilterTextInput,
  MRT_ToggleFiltersButton,
  useMantineReactTable,
} from 'mantine-react-table';
import moment from 'moment';
import * as XLSX from 'xlsx';

import type { RouterOutputs } from '@eboto/api';
import { isElectionEnded, isElectionOngoing } from '@eboto/constants';

import CenterLoader from '~/components/center-loader';
import CreateVoter from '~/components/modals/create-voter';
import DeleteBulkVoter from '~/components/modals/delete-bulk-voter';
import DeleteVoter from '~/components/modals/delete-voter';
import EditVoter from '~/components/modals/edit-voter';
import UpdateVoterField from '~/components/modals/update-voter-field';
import UploadBulkVoter from '~/components/modals/upload-bulk-voter';
import { api } from '~/trpc/client';

export default function Page({
  params,
}: {
  params: Promise<{ electionDashboardSlug: string }>;
}) {
  const { electionDashboardSlug } = use(params);

  const getVotersByElectionSlugQeury =
    api.election.getVotersByElectionSlug.useQuery({
      election_slug: electionDashboardSlug,
    });

  const votersQuery = api.election.getVotersByElectionSlug.useQuery({
    election_slug: electionDashboardSlug,
  });
  const [infoOpened, { close, open }] = useDisclosure(false);

  const [rowSelection, setRowSelection] = useState<MRT_RowSelectionState>({});

  const columns = useMemo<
    MRT_ColumnDef<
      RouterOutputs['election']['getVotersByElectionSlug']['voters'][number]
    >[]
  >(
    () => [
      {
        accessorKey: 'email',
        header: 'Email',
      },
      ...(votersQuery.data?.election.voter_fields.map((voter_field) => ({
        accessorKey: 'field.' + voter_field.id,
        header: voter_field.name,
      })) ?? []),
      {
        accessorKey: 'has_voted',
        header: 'Voted?',
        size: 75,
        Cell: ({ cell }) => (cell.getValue<boolean>() ? 'Yes' : 'No'),
        enableClickToCopy: false,
      },
      {
        accessorKey: 'created_at',
        header: 'Created',
        size: 100,
        Cell: ({ cell }) => moment(cell.getValue<Date>()).fromNow(),
      },
    ],
    [votersQuery.data?.election.voter_fields],
  );
  const table = useMantineReactTable({
    columns,
    data: votersQuery.data?.voters ?? [],
    enableRowSelection: true,
    enableFullScreenToggle: false,
    enableDensityToggle: false,
    enableColumnOrdering: true,
    onRowSelectionChange: setRowSelection,
    getRowId: (row) => row.id,
    enableStickyHeader: true,
    mantinePaperProps: {
      shadow: 'none',
    },
    initialState: {
      pagination: { pageSize: 15, pageIndex: 0 },
      showGlobalFilter: true,
    },
    state: {
      density: 'xs',
      isLoading: votersQuery.isPending,
      showAlertBanner: votersQuery.isError,
      rowSelection,
    },
    enableClickToCopy: true,
    mantineTableContainerProps: {
      style: { maxHeight: '70vh' },
      width: '100%',
    },
    // mantineProgressProps: ({ isTopToolbar }) => ({
    //     sx: {
    //       display: isTopToolbar ? "block" : "none",
    //     },
    // }),
    mantineSearchTextInputProps: {
      placeholder: 'Search voters',
      miw: 100,
    },
    positionToolbarAlertBanner: 'bottom',
    enableRowActions: true,
    positionActionsColumn: 'last',
    renderTopToolbar: () => (
      <Flex gap="sm" p="sm" pb="xs" justify="space-between">
        <Flex gap="xs">
          <Tooltip withArrow label="Refresh">
            <div>
              <ActionIcon
                variant="light"
                onClick={async () => await votersQuery.refetch()}
                size="lg"
                loading={votersQuery.isRefetching}
                hiddenFrom="sm"
                loaderProps={{
                  width: 18,
                }}
              >
                <IconRefresh size="1.25rem" />
              </ActionIcon>
              <Button
                variant="light"
                onClick={async () => await votersQuery.refetch()}
                loading={votersQuery.isRefetching}
                leftSection={<IconRefresh size="1.25rem" />}
                visibleFrom="sm"
                loaderProps={{
                  width: 20,
                }}
              >
                Refresh
              </Button>
            </div>
          </Tooltip>

          <Tooltip withArrow label="Export to Excel">
            <Button
              variant="light"
              leftSection={<IconDownload size="1.25rem" />}
              onClick={() => {
                if (!votersQuery.data) return;
                const voterFields = votersQuery.data.election.voter_fields;
                const rows = votersQuery.data.voters.map((voter) => {
                  const fieldByName = voterFields.reduce<
                    Record<string, string>
                  >((acc, vf) => {
                    acc[vf.name] =
                      (voter.field as Record<string, string> | null)?.[vf.id] ??
                      '';
                    return acc;
                  }, {});

                  return {
                    Email: voter.email,
                    ...fieldByName,
                    'Voted?': voter.has_voted ? 'Yes' : 'No',
                  };
                });

                const worksheet = XLSX.utils.json_to_sheet(rows);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, 'Voters');
                const filename = `${votersQuery.data.election.name} (@${votersQuery.data.election.slug}) - Voters.xlsx`;
                XLSX.writeFile(workbook, filename);
              }}
              disabled={
                !votersQuery.data || votersQuery.data.voters.length === 0
              }
            >
              Export
            </Button>
          </Tooltip>

          <Tooltip withArrow label="Delete selected">
            <DeleteBulkVoter
              voters={
                votersQuery.data?.voters
                  .filter((voter) => rowSelection[voter.id])
                  .map((voter) => ({
                    id: voter.id,
                    email: voter.email,
                  })) ?? []
              }
              election_id={getVotersByElectionSlugQeury.data?.election.id ?? ''}
              isDisabled={
                votersQuery.data?.voters.length === 0 ||
                Object.keys(rowSelection).length === 0 ||
                Object.values(rowSelection).every((isSelected) => !isSelected)
              }
              onSuccess={() => {
                setRowSelection({});
              }}
            />
          </Tooltip>
        </Flex>

        <Flex>
          <MRT_GlobalFilterTextInput table={table} size="sm" />
          <MRT_ToggleFiltersButton table={table} size={36} />
        </Flex>
      </Flex>
    ),
    renderRowActions: ({ row }) => {
      return (
        <Flex gap="sm">
          <Tooltip withArrow label="Edit">
            <EditVoter
              voter_fields={votersQuery.data?.election.voter_fields ?? []}
              election_id={getVotersByElectionSlugQeury.data?.election.id ?? ''}
              voter={{
                id: row.id,
                email: row.getValue<string>('email'),
                field: row.original.field as Record<string, string>,
              }}
            />
          </Tooltip>

          <Tooltip withArrow label="Delete">
            <DeleteVoter
              voter={{
                id: row.id,
                email: row.getValue<string>('email'),
              }}
              election_id={getVotersByElectionSlugQeury.data?.election.id ?? ''}
            />
          </Tooltip>
        </Flex>
      );
    },
  });

  if (
    getVotersByElectionSlugQeury.isLoading ||
    !getVotersByElectionSlugQeury.data
  ) {
    return <CenterLoader />;
  }

  return (
    <Box>
      <Modal
        opened={infoOpened}
        onClose={close}
        title="Additional informations"
      >
        <Alert variant="transparent" color="gray" icon={<IconInfoCircle />}>
          An email will be sent to the voter&apos;s email address with a link to
          vote when the election starts.
        </Alert>

        <Alert variant="transparent" color="gray" icon={<IconInfoCircle />}>
          You can&apos;t change the group of voters once the election starts.
        </Alert>
      </Modal>
      <Stack>
        <Flex
          gap="xs"
          align={{ sm: 'center' }}
          direction={{ base: 'column', sm: 'row' }}
        >
          <Group gap="xs" grow preventGrowOverflow={false}>
            <CreateVoter
              election_id={getVotersByElectionSlugQeury.data.election.id}
              voter_fields={votersQuery.data?.election.voter_fields ?? []}
            />
            <UploadBulkVoter
              election_id={getVotersByElectionSlugQeury.data.election.id}
              voter_fields={votersQuery.data?.election.voter_fields ?? []}
            />
          </Group>
          {!votersQuery.isLoading && votersQuery.data?.election && (
            <Tooltip
              label={
                <Text>
                  You can&apos;t change the voter&apos;s group once the <br />
                  election is ongoing and if there&apos;s already a voter
                </Text>
              }
            >
              <UpdateVoterField
                election={votersQuery.data.election}
                isDisabled={
                  isElectionOngoing({
                    election: votersQuery.data.election,
                  }) || isElectionEnded({ election: votersQuery.data.election })
                }
              />
            </Tooltip>
          )}

          <Tooltip label="Additional informations">
            <ActionIcon onClick={open} size={36} variant="subtle">
              <IconInfoCircle size={20} />
            </ActionIcon>
          </Tooltip>

          {votersQuery.data?.election.voter_domain && (
            <Tooltip label="Voter's email with this domain will be allowed to vote">
              <Text size="sm">
                Voter Domain: @{votersQuery.data.election.voter_domain}
              </Text>
            </Tooltip>
          )}
        </Flex>

        <MantineReactTable table={table} />
      </Stack>
    </Box>
  );
}
