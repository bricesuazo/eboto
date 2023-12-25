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
  Text,
  Tooltip,
} from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";
import type { MRT_ColumnDef, MRT_RowSelectionState } from "mantine-react-table";
import { MantineReactTable, useMantineReactTable } from "mantine-react-table";
import moment from "moment";

import type { RouterOutputs } from "@eboto/api";
import { isElectionOngoing } from "@eboto/constants";

import DeleteBulkVoter from "../modals/delete-bulk-voter";
import DeleteVoter from "../modals/delete-voter";
import EditVoter from "../modals/edit-voter";
import UpdateVoterField from "../modals/update-voter-field";

export default function DashboardVoter({
  data,
}: {
  data: RouterOutputs["election"]["getVotersByElectionSlug"];
}) {
  const votersQuery = api.election.getVotersByElectionSlug.useQuery(
    { election_slug: data.election.slug },
    { initialData: data },
  );

  const [rowSelection, setRowSelection] = useState<MRT_RowSelectionState>({});

  const columns = useMemo<
    MRT_ColumnDef<
      RouterOutputs["election"]["getVotersByElectionSlug"]["voters"][number]
    >[]
  >(
    () => [
      {
        accessorKey: "email",
        header: "Email",
      },
      ...((votersQuery.data.election.voter_fields.map((voter_field) => ({
        accessorKey: "field." + voter_field.id,
        header: voter_field.name,
      })) ?? []) as MRT_ColumnDef<
        RouterOutputs["election"]["getVotersByElectionSlug"]["voters"][number]
      >[]),
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
    [votersQuery.data.election.voter_fields],
  );
  const table = useMantineReactTable({
    columns,
    data: votersQuery.data.voters,
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
    initialState: { pagination: { pageSize: 15, pageIndex: 0 } },
    state: {
      density: "xs",
      isLoading: votersQuery.isPending,
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
            voters={votersQuery.data.voters
              .filter((voter) => rowSelection[voter.id])
              .map((voter) => ({
                id: voter.id,
                email: voter.email,
              }))}
            election_id={data.election.id}
            isDisabled={
              votersQuery.data.voters.length === 0 ||
              Object.keys(rowSelection).length === 0 ||
              Object.values(rowSelection).every((isSelected) => !isSelected)
            }
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
            voter_fields={votersQuery.data.election.voter_fields}
            election_id={data.election.id}
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
            election_id={data.election.id}
          />
        </Tooltip>
      </Flex>
    ),
  });

  return (
    <Box>
      <Stack>
        <Flex
          gap="xs"
          align={{ sm: "center" }}
          direction={{ base: "column", sm: "row" }}
        >
          <Group gap="xs" grow preventGrowOverflow={false}>
            <CreateVoter election_id={data.election.id} />
            <UploadBulkVoter election_id={data.election.id} />
          </Group>
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
              isDisabled={isElectionOngoing({
                election: votersQuery.data.election,
              })}
            />
          </Tooltip>
          {votersQuery.data.election.voter_domain && (
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
