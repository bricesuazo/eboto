import {
  Button,
  Text,
  useMantineTheme,
  ActionIcon,
  createStyles,
} from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
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
  const { classes } = useStyles();
  const theme = useMantineTheme();
  const removeVoterMutation = api.voter.removeSingle.useMutation({
    onSuccess: async () => {
      await context.election.getElectionVoter.invalidate();
    },
  });
  return (
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
        <Text align="center">{voter.status}</Text>
      </td>
      <td>
        <Button
          compact
          color="red"
          sx={(theme) => ({
            [theme.fn.smallerThan("xs")]: {
              display: "none",
            },
          })}
          onClick={() =>
            removeVoterMutation.mutate({
              electionId,
              voterId: voter.id,
              isInvitedVoter: voter.status !== "ACCEPTED" ? true : false,
            })
          }
          loading={removeVoterMutation.isLoading}
          loaderPosition="center"
        >
          Delete
        </Button>
        <ActionIcon
          color="red"
          onClick={() =>
            removeVoterMutation.mutate({
              electionId,
              voterId: voter.id,
              isInvitedVoter: voter.status !== "ACCEPTED" ? true : false,
            })
          }
          sx={(theme) => ({
            [theme.fn.largerThan("xs")]: {
              display: "none",
            },
          })}
          loading={removeVoterMutation.isLoading}
        >
          <IconTrash size="1.25rem" />
        </ActionIcon>
      </td>
    </tr>
  );
};

export default Voter;
