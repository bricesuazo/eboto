import { Button, Text, Flex, Box, Stack, Modal, Group } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconCheck,
  IconMailForward,
  IconUpload,
  IconUserPlus,
  IconUsersGroup,
} from "@tabler/icons-react";
import { useRouter } from "next/router";
import CreateVoterModal from "../../../components/modals/CreateVoter";
import { MantineReactTable, type MRT_ColumnDef } from "mantine-react-table";
import { api } from "../../../utils/api";
import UploadBulkVoter from "../../../components/modals/UploadBulkVoter";
import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { notifications } from "@mantine/notifications";
import { isElectionOngoing } from "../../../utils/isElectionOngoing";
import { env } from "../../../env.mjs";
import UpdateVoterField from "../../../components/modals/UpdateVoterField";

const DashboardVoter = () => {
  const context = api.useContext();
  const router = useRouter();
  const [
    openedInviteVoters,
    { open: openInviteVoters, close: closeInviteVoters },
  ] = useDisclosure(false);
  const [
    openedCreateVoter,
    { open: openCreateVoter, close: closeCreateVoter },
  ] = useDisclosure(false);
  const [openedVoterField, { open: openVoterField, close: closeVoterField }] =
    useDisclosure(false);
  const [openedBulkImport, { open: openBulkVoter, close: closeBulkVoter }] =
    useDisclosure(false);
  const [votersData, setVotersData] = useState<
    {
      id: string;
      email: string;
      accountStatus: "ACCEPTED" | "INVITED" | "DECLINED" | "ADDED";
      hasVoted: boolean;
      createdAt: Date;
    }[]
  >([]);

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

  const voters = api.election.getElectionVoter.useQuery(
    router.query.electionSlug as string,
    {
      enabled: router.isReady,
    }
  );
  useEffect(() => {
    setVotersData(voters.data?.voters ?? []);
  }, [voters.data?.voters, router.route]);

  const columns = useMemo<MRT_ColumnDef[]>(
    () => [
      {
        accessorKey: "email",
        header: "Email address",
      },
      {
        accessorKey: "accountStatus",
        header: "Account status",
      },
      {
        accessorKey: "hasVoted",
        header: "Has voted?",
      },
      // {
      //   accessorKey: "createdAt",
      //   header: "Created at",
      //   columnDefType: "display",
      // },
    ],
    []
  );

  return (
    <>
      <Head>
        <title>
          {voters.data && `${voters.data.election.name} – `}Voters | eBoto Mo
        </title>
      </Head>

      <Box p="md" h="100%">
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
              This will send an email to all voters that are not yet invited and
              has status of &quot;ADDED&quot;.
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
                    electionId: voters.data?.election.id ?? "",
                  })
                }
                disabled={voters.isLoading || !voters.data}
              >
                Invite All
              </Button>
            </Group>
          </Stack>
        </Modal>

        <UpdateVoterField
          isOpen={openedVoterField}
          electionId={voters.data?.election.id ?? ""}
          onClose={closeVoterField}
        />
        <CreateVoterModal
          isOpen={openedCreateVoter}
          electionId={voters.data?.election.id ?? ""}
          onClose={closeCreateVoter}
        />

        <UploadBulkVoter
          isOpen={openedBulkImport}
          electionId={voters.data?.election.id ?? ""}
          onClose={closeBulkVoter}
        />

        <Stack h="100%">
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
                disabled={voters.isLoading || !voters.data}
                sx={(theme) => ({
                  [theme.fn.smallerThan("xs")]: {
                    width: "100%",
                  },
                })}
              >
                Import
              </Button>
            </Flex>
            <Button
              w="full"
              variant="light"
              leftIcon={<IconUsersGroup size="1rem" />}
              onClick={openVoterField}
              disabled={
                voters.isLoading ||
                !voters.data ||
                env.NEXT_PUBLIC_NODE_ENV === "production"
              }
            >
              Group
            </Button>
            {voters.data &&
              isElectionOngoing({
                election: voters.data.election,
                withTime: true,
              }) && (
                <Button
                  variant="light"
                  leftIcon={<IconMailForward size="1rem" />}
                  onClick={openInviteVoters}
                >
                  Invite
                </Button>
              )}
          </Flex>

          <MantineReactTable
            columns={columns}
            data={votersData}
            enableFullScreenToggle={false}
            enableDensityToggle={false}
            enableStickyHeader
            initialState={{
              density: "xs",
              pagination: { pageSize: 15, pageIndex: 0 },
            }}
            state={{
              isLoading: voters.isLoading,
              showAlertBanner: voters.isError,
            }}
            enableClickToCopy={true}
            mantineTableContainerProps={{
              sx: { maxHeight: "70vh" },
            }}
            mantinePaginationProps={{
              rowsPerPageOptions: ["5", "10", "15", "20", "30", "50", "100"],
            }}
          />
        </Stack>
      </Box>
    </>
  );
};

export default DashboardVoter;
