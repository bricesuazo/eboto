"use client";

import { useMemo, useState } from "react";
import CreateVoter from "@/components/client/modals/create-voter";
import UploadBulkVoter from "@/components/client/modals/upload-bulk-voter";
import { api } from "@/trpc/client";
import {
  ActionIcon,
  Box,
  Button,
  Flex,
  Group,
  Stack,
  Tooltip,
} from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";
import type { MRT_ColumnDef, MRT_RowSelectionState } from "mantine-react-table";
import { MantineReactTable, useMantineReactTable } from "mantine-react-table";
import moment from "moment";

import type { RouterOutputs } from "@eboto-mo/api";
import type { Election, VoterField } from "@eboto-mo/db/schema";

import DeleteBulkVoter from "../modals/delete-bulk-voter";
import DeleteVoter from "../modals/delete-voter";
import EditVoter from "../modals/edit-voter";

export default function DashboardVoter({
  election,
  voters,
}: {
  election: Election & { voter_fields: VoterField[] };
  voters: RouterOutputs["election"]["getVotersByElectionId"];
}) {
  const votersQuery = api.election.getVotersByElectionId.useQuery(
    {
      election_id: election.id,
    },
    {
      initialData: voters,
    },
  );

  const [rowSelection, setRowSelection] = useState<MRT_RowSelectionState>({});

  const columns = useMemo<MRT_ColumnDef<(typeof votersQuery.data)[number]>[]>(
    () => [
      {
        accessorKey: "email",
        header: "Email",
      },
      // ...((election.voter_fields.map((voter_field) => ({
      //   accessorKey: "field." + voter_field.name,
      //   header: voter_field.name,
      // })) ?? []) as MRT_ColumnDef<(typeof votersQuery.data)[number]>[]),
      {
        accessorKey: "has_voted",
        header: "Voted?",
        size: 75,
        Cell: ({ cell }) => (cell.getValue<boolean>() ? "Yes" : "No"),
        enableClickToCopy: false,
      },
      {
        accessorKey: "created_at",
        header: "Created",
        size: 100,
        Cell: ({ cell }) => moment(cell.getValue<Date>()).fromNow(),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [election.voter_fields],
  );
  const table = useMantineReactTable({
    columns,
    data: votersQuery.data,
    enableRowSelection: true,
    enableFullScreenToggle: false,
    enableDensityToggle: false,
    enableColumnOrdering: true,
    onRowSelectionChange: setRowSelection,
    getRowId: (row) => row.id,
    enableStickyHeader: true,
    mantinePaperProps: {
      shadow: "none",
    },
    state: {
      density: "xs",
      pagination: { pageSize: 15, pageIndex: 0 },
      isLoading: votersQuery.isLoading,
      showAlertBanner: votersQuery.isError,
      rowSelection,
    },
    enableClickToCopy: true,
    mantineTableContainerProps: {
      style: { maxHeight: "70vh" },
      width: "100%",
    },
    // mantineProgressProps: ({ isTopToolbar }) => ({
    //     sx: {
    //       display: isTopToolbar ? "block" : "none",
    //     },
    // }),
    positionToolbarAlertBanner: "bottom",
    enableRowActions: true,
    positionActionsColumn: "last",
    renderTopToolbar: () => (
      <Group gap="xs" p="sm" pb="xs">
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

        <Tooltip withArrow label="Delete selected">
          <DeleteBulkVoter
            voters={votersQuery.data
              .filter((voter) => rowSelection[voter.id])
              .map((voter) => ({
                id: voter.id,
                email: voter.email,
              }))}
            election_id={election.id}
            isDisabled={Object.keys(rowSelection).length === 0}
            onSuccess={() => {
              setRowSelection({});
            }}
          />
        </Tooltip>
      </Group>
    ),
    renderRowActions: ({ row }) => (
      <Flex gap="sm">
        <Tooltip withArrow label="Edit">
          <EditVoter
            voter_fields={election.voter_fields}
            election_id={election.id}
            voter={{
              id: row.id,
              email: row.getValue<string>("email"),
            }}
          />
        </Tooltip>

        <Tooltip withArrow label="Delete">
          <DeleteVoter
            voter={{
              id: row.id,
              email: row.getValue<string>("email"),
            }}
            election_id={election.id}
          />
        </Tooltip>
      </Flex>
    ),
  });

  return (
    <Box>
      <Stack>
        <Flex gap="xs" direction={{ base: "column", sm: "row" }}>
          <Group gap="xs">
            <CreateVoter election_id={election.id} />
            <UploadBulkVoter election_id={election.id} />
          </Group>
          {/* <Tooltip
            label={
              <Text>
                You can&apos;t change the voter&apos;s group once the <br />
                election is ongoing and if there&apos;s already a voter
              </Text>
            }
          >
            <UpdateVoterField
              election={election}
              isDisabled={isElectionOngoing({ election })}
            />
          </Tooltip> */}
        </Flex>

        <MantineReactTable table={table} />
      </Stack>
    </Box>
  );
}
