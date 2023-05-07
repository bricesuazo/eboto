import {
  Button,
  Text,
  Flex,
  Box,
  Stack,
  Modal,
  Group,
  Tooltip,
  ActionIcon,
  Loader,
  Center,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconCheck,
  IconMailForward,
  IconUpload,
  IconUserPlus,
  IconUsersGroup,
  IconTrash,
  IconRefresh,
  IconEdit,
} from "@tabler/icons-react";
import { useRouter } from "next/router";
import CreateVoterModal from "../../../components/modals/CreateVoter";
import {
  MantineReactTable,
  type MRT_RowSelectionState,
  type MRT_ColumnDef,
} from "mantine-react-table";
import { api } from "../../../utils/api";
import UploadBulkVoter from "../../../components/modals/UploadBulkVoter";
import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { notifications } from "@mantine/notifications";
import { isElectionOngoing } from "../../../utils/isElectionOngoing";
import UpdateVoterField from "../../../components/modals/UpdateVoterField";
import moment from "moment";
import ConfirmDeleteVoterModal from "../../../components/modals/ConfirmDeleteVoterModal";
import ConfirmDeleteBulkVoterModal from "../../../components/modals/ConfirmDeleteBulkVoterModal";
import { IconUserMinus } from "@tabler/icons-react";
import EditVoterModal from "../../../components/modals/EditVoterModal";

const DashboardVoter = () => {
  const context = api.useContext();
  const router = useRouter();
  const voters = api.election.getElectionVoter.useQuery(
    router.query.electionSlug as string,
    {
      enabled: router.isReady,
    }
  );
  const [
    openedInviteVoters,
    { open: openInviteVoters, close: closeInviteVoters },
  ] = useDisclosure(false);
  const [openedEditVoter, { open: openEditVoter, close: closeEditVoter }] =
    useDisclosure(false);
  const [
    openedCreateVoter,
    { open: openCreateVoter, close: closeCreateVoter },
  ] = useDisclosure(false);
  const [openedVoterField, { open: openVoterField, close: closeVoterField }] =
    useDisclosure(false);
  const [openedBulkImport, { open: openBulkVoter, close: closeBulkVoter }] =
    useDisclosure(false);
  const [
    openedConfirmDeleteVoter,
    { open: openConfirmDeleteVoter, close: closeConfirmDeleteVoter },
  ] = useDisclosure(false);
  const [
    openedConfirmDeleteBulkVoters,
    { open: openConfirmDeleteBulkVoters, close: closeConfirmDeleteBulkVoters },
  ] = useDisclosure(false);
  const [votersData, setVotersData] = useState<
    {
      id: string;
      email: string;
      accountStatus: "ACCEPTED" | "INVITED" | "DECLINED" | "ADDED";
      hasVoted: boolean;
      createdAt: Date;
      field: {
        [key: string]: string | undefined;
      } | null;
    }[]
  >([]);
  const [voterToDelete, setVoterToDelete] = useState<{
    id: string;
    email: string;
    accountStatus: "ACCEPTED" | "INVITED" | "DECLINED" | "ADDED";
  }>({
    id: "",
    email: "",
    accountStatus: "ADDED",
  });
  const [voterToEdit, setVoterToEdit] = useState<{
    id: string;
    email: string;
    field: { [key: string]: string | undefined };
  }>({
    id: "",
    email: "",
    field: {},
  });

  const [rowSelection, setRowSelection] = useState<MRT_RowSelectionState>({});

  const sendManyInvitationsMutation = api.voter.sendManyInvitations.useMutation(
    {
      onSuccess: async (data) => {
        await context.election.getElectionVoter.invalidate();
        notifications.show({
          title: `${data.length} invitations sent!`,
          message: "Successfully sent invitations",
          icon: <IconCheck size="1.1rem" />,
          autoClose: 5000,
        });
        closeInviteVoters();
      },
    }
  );

  useEffect(() => {
    setVotersData(
      voters.data?.voters.map((voter) => ({
        id: voter.id,
        email: voter.email,
        accountStatus: voter.accountStatus,
        hasVoted: voter.hasVoted,
        createdAt: voter.createdAt,
        field: voter.field,
      })) ?? []
    );
  }, [voters.data?.voters, router.route, voters.data?.election.voterField]);

  const columns = useMemo<MRT_ColumnDef<(typeof votersData)[0]>[]>(
    () => [
      {
        accessorKey: "email",
        header: "Email",
      },
      ...((voters.data?.election.voterField.map((voterField) => ({
        accessorKey: "field." + voterField.name,
        header: voterField.name,
      })) ?? []) as MRT_ColumnDef<(typeof votersData)[0]>[]),
      {
        accessorKey: "accountStatus",
        header: "Status",
        size: 75,
        enableClickToCopy: false,
        Cell: ({ cell }) =>
          cell.getValue<string>().charAt(0) +
          cell.getValue<string>().slice(1).toLowerCase(),
      },
      {
        accessorKey: "hasVoted",
        header: "Voted?",
        size: 75,
        Cell: ({ cell }) => (cell.getValue<boolean>() ? "Yes" : "No"),
        enableClickToCopy: false,
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        size: 100,
        Cell: ({ cell }) => moment(cell.getValue<Date>()).fromNow(),
      },
    ],
    [voters.data?.election.voterField]
  );

  return (
    <>
      <Head>
        {voters.data ? (
          <title>{`${voters.data.election.name} – `}Voters | eBoto Mo</title>
        ) : (
          <title>Voters | eBoto Mo</title>
        )}
      </Head>

      {voters.isLoading ? (
        <Center h="100%">
          <Loader />
        </Center>
      ) : !voters.data || voters.isError ? (
        <Text>
          {voters.error.message ?? "An error occurred while fetching data"}
        </Text>
      ) : (
        <Box p="md">
          <Modal
            opened={openedInviteVoters || sendManyInvitationsMutation.isLoading}
            onClose={closeInviteVoters}
            title={
              <Text weight={600}>
                Are you sure you want to invite all voters?
              </Text>
            }
          >
            <Stack spacing="sm">
              <Text>
                This will send an email to all voters that are not yet invited
                and has status of &quot;ADDED&quot;.
              </Text>
              <Group position="right" spacing="xs">
                <Button
                  variant="default"
                  onClick={closeInviteVoters}
                  disabled={sendManyInvitationsMutation.isLoading}
                >
                  Cancel
                </Button>
                <Button
                  loading={sendManyInvitationsMutation.isLoading}
                  onClick={() =>
                    sendManyInvitationsMutation.mutate({
                      electionId: voters.data.election.id,
                    })
                  }
                  disabled={voters.isLoading || !voters.data}
                >
                  Invite All
                </Button>
              </Group>
            </Stack>
          </Modal>
          {!voters.data.voters.length && (
            <UpdateVoterField
              isOpen={openedVoterField}
              electionId={voters.data.election.id}
              onClose={closeVoterField}
              voterFields={voters.data.election.voterField}
            />
          )}

          <CreateVoterModal
            isOpen={openedCreateVoter}
            voterFields={voters.data.election.voterField}
            electionId={voters.data.election.id}
            onClose={closeCreateVoter}
          />

          <EditVoterModal
            isOpen={openedEditVoter}
            voterFields={voters.data.election.voterField}
            electionId={voters.data.election.id}
            onClose={closeEditVoter}
            voter={voterToEdit}
          />

          <UploadBulkVoter
            isOpen={openedBulkImport}
            electionId={voters.data.election.id}
            voterFields={voters.data.election.voterField}
            onClose={closeBulkVoter}
          />

          <ConfirmDeleteVoterModal
            voter={voterToDelete}
            isOpen={openedConfirmDeleteVoter}
            electionId={voters.data.election.id}
            onClose={closeConfirmDeleteVoter}
          />

          <ConfirmDeleteBulkVoterModal
            voters={votersData
              .filter((voter) => rowSelection[voter.id])
              .map((voter) => ({
                id: voter.id,
                email: voter.email,
              }))}
            setRowSelection={setRowSelection}
            isOpen={openedConfirmDeleteBulkVoters}
            electionId={voters.data.election.id}
            onClose={closeConfirmDeleteBulkVoters}
          />

          <Stack>
            <Flex
              gap="xs"
              sx={(theme) => ({
                [theme.fn.smallerThan("xs")]: {
                  flexDirection: "column",
                },
              })}
            >
              <Flex gap="xs">
                <Button
                  leftIcon={<IconUserPlus size="1rem" />}
                  onClick={openCreateVoter}
                  disabled={voters.isLoading || !voters.data}
                  sx={(theme) => ({
                    [theme.fn.smallerThan("xs")]: {
                      width: "100%",
                    },
                  })}
                >
                  Add voter
                </Button>
                <Button
                  onClick={openBulkVoter}
                  leftIcon={<IconUpload size="1rem" />}
                  variant="light"
                  sx={(theme) => ({
                    [theme.fn.smallerThan("xs")]: {
                      width: "100%",
                    },
                  })}
                >
                  Import
                </Button>
              </Flex>
              <Flex gap="xs">
                <Tooltip
                  label={
                    <Text>
                      You can&apos;t change the voter&apos;s group once the{" "}
                      <br />
                      election is ongoing and if there&apos;s already a voter
                    </Text>
                  }
                >
                  <Button
                    variant="light"
                    leftIcon={<IconUsersGroup size="1rem" />}
                    onClick={openVoterField}
                    disabled={
                      !!voters.data.voters.length ||
                      isElectionOngoing({
                        election: voters.data.election,
                        withTime: true,
                      })
                    }
                    sx={(theme) => ({
                      [theme.fn.smallerThan("xs")]: {
                        width: "100%",
                      },
                    })}
                  >
                    Group
                  </Button>
                </Tooltip>

                {isElectionOngoing({
                  election: voters.data.election,
                  withTime: true,
                }) && (
                  <Button
                    variant="light"
                    leftIcon={<IconMailForward size="1rem" />}
                    onClick={openInviteVoters}
                    sx={(theme) => ({
                      [theme.fn.smallerThan("xs")]: {
                        width: "100%",
                      },
                    })}
                  >
                    Invite
                  </Button>
                )}
              </Flex>
            </Flex>

            <MantineReactTable
              columns={columns}
              data={votersData}
              enableFullScreenToggle={false}
              enableDensityToggle={false}
              enableRowSelection
              enableColumnOrdering
              onRowSelectionChange={setRowSelection}
              getRowId={(row) => row.id}
              enableStickyHeader
              initialState={{
                density: "xs",
                pagination: { pageSize: 15, pageIndex: 0 },
              }}
              state={{
                isLoading: voters.isLoading,
                showAlertBanner: voters.isError,
                rowSelection,
              }}
              enableClickToCopy={true}
              mantineTableContainerProps={{
                sx: { maxHeight: "70vh" },
                width: "100%",
              }}
              mantineProgressProps={({ isTopToolbar }) => ({
                sx: {
                  display: isTopToolbar ? "block" : "none",
                },
              })}
              positionToolbarAlertBanner="bottom"
              renderTopToolbarCustomActions={() => (
                <Group spacing="xs">
                  <Tooltip withArrow label="Refresh">
                    <ActionIcon
                      variant="light"
                      onClick={() => voters.refetch()}
                      loading={voters.isRefetching}
                      size="lg"
                      sx={(theme) => ({
                        [theme.fn.largerThan("xs")]: {
                          display: "none",
                        },
                      })}
                      loaderProps={{
                        width: 18,
                      }}
                    >
                      <IconRefresh size="1.25rem" />
                    </ActionIcon>
                  </Tooltip>

                  <Tooltip withArrow label="Delete selected">
                    <ActionIcon
                      color="red"
                      onClick={openConfirmDeleteBulkVoters}
                      size="lg"
                      variant="outline"
                      sx={(theme) => ({
                        [theme.fn.largerThan("xs")]: {
                          display: "none",
                        },
                      })}
                      disabled={
                        voters.isLoading ||
                        !voters.data ||
                        Object.keys(rowSelection).length === 0
                      }
                    >
                      <IconUserMinus size="1.25rem" />
                    </ActionIcon>
                  </Tooltip>
                  <Button
                    variant="light"
                    onClick={() => voters.refetch()}
                    loading={voters.isRefetching}
                    leftIcon={<IconRefresh size="1.25rem" />}
                    sx={(theme) => ({
                      [theme.fn.smallerThan("xs")]: {
                        display: "none",
                      },
                    })}
                    loaderProps={{
                      width: 20,
                    }}
                  >
                    Refresh
                  </Button>
                  <Button
                    color="red"
                    variant="outline"
                    onClick={openConfirmDeleteBulkVoters}
                    disabled={
                      voters.isLoading ||
                      !voters.data ||
                      Object.keys(rowSelection).length === 0
                    }
                    leftIcon={<IconUserMinus size="1.25rem" />}
                    sx={(theme) => ({
                      [theme.fn.smallerThan("xs")]: {
                        display: "none",
                      },
                    })}
                  >
                    Delete selected
                  </Button>
                </Group>
              )}
              enableRowActions
              positionActionsColumn="last"
              renderRowActions={({ row }) => (
                <Box sx={{ display: "flex", gap: "16px" }}>
                  <Tooltip withArrow label="Edit">
                    <ActionIcon
                      onClick={() => {
                        setVoterToEdit({
                          id: row.id,
                          email: row.getValue<string>("email"),
                          field:
                            votersData.find((v) => v.id === row.id)?.field ??
                            {},
                        });
                        openEditVoter();
                      }}
                    >
                      <IconEdit size="1.25rem" />
                    </ActionIcon>
                  </Tooltip>

                  <Tooltip withArrow label="Delete">
                    <ActionIcon
                      color="red"
                      onClick={() => {
                        setVoterToDelete({
                          id: row.id,
                          email: row.getValue<string>("email"),
                          accountStatus: row.getValue<
                            "ACCEPTED" | "INVITED" | "DECLINED" | "ADDED"
                          >("accountStatus"),
                        });
                        openConfirmDeleteVoter();
                      }}
                    >
                      <IconTrash size="1.25rem" />
                    </ActionIcon>
                  </Tooltip>
                </Box>
              )}
            />
          </Stack>
        </Box>
      )}
    </>
  );
};

export default DashboardVoter;
