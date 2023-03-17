import { Button, Flex, Text } from "@mantine/core";
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
  const removeVoterMutation = api.voter.removeSingle.useMutation({
    onSuccess: async () => {
      await refetch();
    },
  });
  return (
    <Flex key={voter.id} columnGap={8}>
      <Text>{voter.email}</Text>
      <Text>({voter.status})</Text>

      <Button
        compact
        color="red"
        variant="subtle"
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
    </Flex>
  );
};

export default Voter;
