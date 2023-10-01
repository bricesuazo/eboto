"use client";

import { useMemo, useState } from "react";
import CreateVoter from "@/components/client/modals/create-voter";
import UpdateVoterField from "@/components/client/modals/update-voter-field";
import UploadBulkVoter from "@/components/client/modals/upload-bulk-voter";
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
import { MantineReactTable } from "mantine-react-table";
import moment from "moment";

import { isElectionOngoing } from "@eboto-mo/constants";
import type { Election, VoterField } from "@eboto-mo/db/schema";

import DeleteBulkVoter from "../modals/delete-bulk-voter";
import DeleteVoter from "../modals/delete-voter";
import EditVoter from "../modals/edit-voter";

// TODO: Fix MantineReactTable or update when fixed in Mantine v7

export default function DashboardVoter({
  election,
  voters,
}: {
  election: Election & { voter_fields: VoterField[] };
  voters: {
    id: string;
    email: string;
    account_status: string;
    created_at: Date;
    has_voted: boolean;
  }[];
}) {
  const [rowSelection, setRowSelection] = useState<MRT_RowSelectionState>({});

  const columns = useMemo<MRT_ColumnDef<(typeof voters)[0]>[]>(
    () => [
      {
        accessorKey: "email",
        header: "Email",
      },
      ...((election.voter_fields.map((voter_field) => ({
        accessorKey: "field." + voter_field.name,
        header: voter_field.name,
      })) ?? []) as MRT_ColumnDef<(typeof voters)[0]>[]),
      {
        accessorKey: "account_status",
        header: "Status",
        size: 75,
        enableClickToCopy: false,
        Cell: ({ cell }) =>
          cell.getValue<string>().charAt(0) +
          cell.getValue<string>().slice(1).toLowerCase(),
      },
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
    [election.voter_fields],
  );

  // const context = api.useContext();
  // const [isRefreshing, setIsRefreshing] = useState(false);

  return (
    <Box>
      <Stack>
        <Flex gap="xs" direction={{ base: "column", sm: "row" }}>
          <Group gap="xs">
            <CreateVoter election_id={election.id} />
            <UploadBulkVoter
              election_id={election.id}
              voter_fields={election.voter_fields}
            />
          </Group>
          <Group gap="xs">
            <Tooltip
              label={
                <Text>
                  You can&apos;t change the voter&apos;s group once the <br />
                  election is ongoing and if there&apos;s already a voter
                </Text>
              }
            >
              <UpdateVoterField
                election={election}
                voters={voters.map((voter) => ({
                  id: voter.id,
                  email: voter.email,
                }))}
                isDisabled={
                  isElectionOngoing({ election }) || voters.length !== 0
                }
              />
            </Tooltip>
          </Group>
        </Flex>

        <MantineReactTable
          columns={columns}
          data={voters}
          enableFullScreenToggle={false}
          enableDensityToggle={false}
          enableRowSelection
          enableColumnOrdering
          onRowSelectionChange={setRowSelection}
          getRowId={(row) => row.id}
          enableStickyHeader
          mantinePaperProps={{
            shadow: "none",
          }}
          initialState={{
            density: "xs",
            pagination: { pageSize: 15, pageIndex: 0 },
          }}
          state={{
            // isLoading: voters.isLoading,
            // showAlertBanner: voters.isError,
            rowSelection,
          }}
          enableClickToCopy={true}
          mantineTableContainerProps={{
            style: { maxHeight: "70vh" },
            width: "100%",
          }}
          // mantineProgressProps={({ isTopToolbar }) => ({
          //   sx: {
          //     display: isTopToolbar ? "block" : "none",
          //   },
          // })}
          positionToolbarAlertBanner="bottom"
          renderTopToolbarCustomActions={() => (
            <Group gap="xs">
              <Tooltip withArrow label="Refresh">
                <div>
                  <ActionIcon
                    variant="light"
                    onClick={() => {
                      // setIsRefreshing(true);
                      // // await context.election.getVotersByElectionId.invalidate();
                      // setIsRefreshing(false);
                    }}
                    size="lg"
                    // loading={isRefreshing}
                    visibleFrom="sm"
                    loaderProps={{
                      width: 18,
                    }}
                  >
                    <IconRefresh size="1.25rem" />
                  </ActionIcon>
                  <Button
                    variant="light"
                    onClick={() => {
                      // setIsRefreshing(true);
                      // // await context.election.getVotersByElectionId.invalidate();
                      // setIsRefreshing(false);
                    }}
                    // loading={isRefreshing}
                    leftSection={<IconRefresh size="1.25rem" />}
                    hiddenFrom="sm"
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
                  voters={voters
                    .filter((voter) => rowSelection[voter.id])
                    .map((voter) => ({
                      id: voter.id,
                      email: voter.email,
                      isVoter: voter.account_status === "ACCEPTED",
                    }))}
                  election_id={election.id}
                  isDisabled={Object.keys(rowSelection).length === 0}
                  onSuccess={() => {
                    setRowSelection({});
                  }}
                />
              </Tooltip>
            </Group>
          )}
          enableRowActions
          positionActionsColumn="last"
          renderRowActions={({ row }) => (
            <Flex style={{ gap: "16px" }}>
              <Tooltip withArrow label="Edit">
                <EditVoter
                  voter_fields={election.voter_fields}
                  election_id={election.id}
                  voter={{
                    id: row.id,
                    email: row.getValue<string>("email"),
                    account_status: row.getValue<
                      "ACCEPTED" | "INVITED" | "DECLINED" | "ADDED"
                    >("account_status"),
                  }}
                />
              </Tooltip>

              <Tooltip withArrow label="Delete">
                <DeleteVoter
                  voter={{
                    id: row.id,
                    email: row.getValue<string>("email"),
                    account_status: row.getValue<
                      "ACCEPTED" | "INVITED" | "DECLINED" | "ADDED"
                    >("account_status"),
                  }}
                  election_id={election.id}
                />
              </Tooltip>
            </Flex>
          )}
        />
      </Stack>
    </Box>
  );
}
