import {
  Button,
  Text,
  useMantineTheme,
  ActionIcon,
  createStyles,
  Modal,
  Stack,
  Group,
  Flex,
  Box,
  Tooltip,
} from "@mantine/core";
import {
  IconCheck,
  IconMailForward,
  IconTrash,
  IconUserPlus,
  IconX,
} from "@tabler/icons-react";
import ConfirmDeleteVoterModal from "./modals/ConfirmDeleteVoterModal";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { api } from "../utils/api";

const useStyles = createStyles((theme) => ({
  emailCol: {
    width: "100%",

    position: "relative",

    [theme.fn.largerThan("sm")]: {
      width: "50%",
    },
  },

  statusCol: {
    width: "100%",
  },
}));
const Voter = ({
  voter,
  electionId,
}: {
  voter: {
    id: string;
    email: string;
    status: "ACCEPTED" | "INVITED" | "DECLINED" | "ADDED";
  };
  electionId: string;
}) => {
  const context = api.useContext();
  const [
    openedInviteVoter,
    { open: openInviteVoter, close: closeInviteVoter },
  ] = useDisclosure(false);
  const [
    openedConfirmDeleteVoter,
    { open: openConfirmDeleteVoter, close: closeConfirmDeleteVoter },
  ] = useDisclosure(false);

  const sendSingleInvitationMutation =
    api.voter.sendSingleInvitation.useMutation({
      onSuccess: async () => {
        await context.election.getElectionVoter.invalidate();
        notifications.show({
          title: "Invitation sent!",
          message: "Successfully sent invitation",
          icon: <IconCheck size="1.1rem" />,
          autoClose: 5000,
        });
        closeInviteVoter();
      },
    });
  const { classes } = useStyles();
  const theme = useMantineTheme();

  return (
    <>
      <Modal
        opened={openedInviteVoter || sendSingleInvitationMutation.isLoading}
        onClose={closeInviteVoter}
        title={
          <Text weight={600}>
            Are you sure you want to invite {voter.email}
            {voter.status === "INVITED" && " again"}?
          </Text>
        }
      >
        <Stack spacing="sm">
          <Text>
            This will send{voter.status === "INVITED" && " again"} an invitation
            to this voter to join the election.
          </Text>
          <Group position="right" spacing="xs">
            <Button
              variant="default"
              onClick={closeInviteVoter}
              disabled={sendSingleInvitationMutation.isLoading}
            >
              Cancel
            </Button>
            <Button
              loading={sendSingleInvitationMutation.isLoading}
              onClick={() =>
                sendSingleInvitationMutation.mutate({
                  electionId,
                  voterId: voter.id,
                })
              }
            >
              Invite{voter.status === "INVITED" && " again"}
            </Button>
          </Group>
        </Stack>
      </Modal>
      <ConfirmDeleteVoterModal
        isOpen={openedConfirmDeleteVoter}
        onClose={closeConfirmDeleteVoter}
        voter={voter}
        electionId={electionId}
      />
      <tr key={voter.id}>
        <td className={classes.emailCol}>
          <Text
            sx={{
              position: "absolute",
              padding: theme.spacing.xs,
              left: 0,
              right: 0,
              top: "50%",
              transform: "translateY(-50%)",

              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {voter.email}
          </Text>
        </td>
        <td className={classes.statusCol}>
          <Text
            align="center"
            sx={(theme) => ({
              [theme.fn.smallerThan("xs")]: {
                display: "none",
              },
            })}
          >
            {voter.status}
          </Text>
          <Tooltip
            label={voter.status.charAt(0) + voter.status.slice(1).toLowerCase()}
          >
            <Flex
              justify="center"
              sx={(theme) => ({
                [theme.fn.largerThan("xs")]: {
                  display: "none",
                },
              })}
            >
              {voter.status === "ACCEPTED" ? (
                <IconCheck aria-label="Accepted" />
              ) : voter.status === "DECLINED" ? (
                <IconX aria-label="Declined" />
              ) : voter.status === "INVITED" ? (
                <IconMailForward aria-label="Invited" />
              ) : voter.status === "ADDED" ? (
                <IconUserPlus aria-label="Added" />
              ) : null}
            </Flex>
          </Tooltip>
        </td>
        <td>
          <Flex justify="flex-end" gap="xs">
            {(voter.status === "INVITED" || voter.status === "ADDED") && (
              <Button
                compact
                onClick={openInviteVoter}
                loaderPosition="center"
                variant={voter.status === "INVITED" ? "subtle" : "light"}
              >
                <Text
                  sx={(theme) => ({
                    [theme.fn.smallerThan("xs")]: {
                      display: "none",
                    },
                  })}
                >
                  Invite{voter.status === "INVITED" && " again"}
                </Text>
                <Tooltip
                  label={
                    "Invite" + (voter.status === "INVITED" ? " again" : "")
                  }
                >
                  <Box
                    sx={(theme) => ({
                      [theme.fn.largerThan("xs")]: {
                        display: "none",
                      },
                    })}
                  >
                    <IconMailForward size="1.25rem" />
                  </Box>
                </Tooltip>
              </Button>
            )}

            <Button
              compact
              color="red"
              sx={(theme) => ({
                [theme.fn.smallerThan("xs")]: {
                  display: "none",
                },
              })}
              onClick={openConfirmDeleteVoter}
              loaderPosition="center"
            >
              Delete
            </Button>
            <ActionIcon
              color="red"
              onClick={openConfirmDeleteVoter}
              sx={(theme) => ({
                [theme.fn.largerThan("xs")]: {
                  display: "none",
                },
              })}
            >
              <IconTrash size="1.25rem" />
            </ActionIcon>
          </Flex>
        </td>
      </tr>
    </>
  );
};

export default Voter;
