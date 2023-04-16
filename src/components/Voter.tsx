import {
  Button,
  Text,
  useMantineTheme,
  ActionIcon,
  createStyles,
} from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import ConfirmDeleteVoterModal from "./modals/ConfirmDeleteVoterModal";
import { useDisclosure } from "@mantine/hooks";

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
  const [
    openedConfirmDeleteVoter,
    { open: openConfirmDeleteVoter, close: closeConfirmDeleteVoter },
  ] = useDisclosure(false);
  const { classes } = useStyles();
  const theme = useMantineTheme();

  return (
    <>
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
        </td>
      </tr>
    </>
  );
};

export default Voter;
