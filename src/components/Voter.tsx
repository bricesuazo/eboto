import { Button, Text, useMantineTheme, ActionIcon } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { api } from "../utils/api";

const Voter = ({
  voter,
  refetch,
  electionId,
}: {
  voter: {
    id: string;
    email: string;
    status: "ACCEPTED" | "INVITED" | "DECLINED";
  };
  refetch: () => Promise<unknown>;
  electionId: string;
}) => {
  const theme = useMantineTheme();
  const removeVoterMutation = api.voter.removeSingle.useMutation({
    onSuccess: async () => {
      await refetch();
    },
  });
  return (
    <tr key={voter.id}>
      <td
        style={{
          width: "100%",
          position: "relative",
        }}
      >
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
      <td>{voter.status}</td>
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
              isInvitedVoter: voter.status === "INVITED" ? true : false,
            })
          }
          loading={removeVoterMutation.isLoading}
        >
          Delete
        </Button>
        <ActionIcon
          color="red"
          onClick={() =>
            removeVoterMutation.mutate({
              electionId,
              voterId: voter.id,
              isInvitedVoter: voter.status === "INVITED" ? true : false,
            })
          }
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
  );
};

export default Voter;
