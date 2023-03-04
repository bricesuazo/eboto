import { Button, Flex, Group, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import type { Candidate, Partylist } from "@prisma/client";
import { api } from "../utils/api";
import EditCandidateModal from "./modals/EditCandidate";
import { IconCheck } from "@tabler/icons-react";

const CandidateCard = ({
  candidate,
  refetch,
  partylists,
}: {
  candidate: Candidate;
  refetch: () => Promise<unknown>;
  partylists: Partylist[];
}) => {
  const [opened, { open, close }] = useDisclosure(false);
  const deletePositionMutation = api.candidate.deleteSingle.useMutation({
    onSuccess: async (data) => {
      await refetch();
      notifications.show({
        title: `${data.first_name} ${data.last_name} deleted!`,
        message: "Successfully deleted candidate",
        icon: <IconCheck size="1.1rem" />,
        autoClose: 5000,
      });
    },
  });

  return (
    <>
      <EditCandidateModal
        isOpen={opened}
        onClose={close}
        partylists={partylists}
        candidate={candidate}
        refetch={refetch}
      />
      <Group w={48} h={32} p={4}>
        <Text align="center" w="full">
          {candidate.first_name} {candidate.last_name}
        </Text>

        <Flex>
          <Button onClick={open} variant="ghost" size="sm" w="fit-content">
            Edit
          </Button>
          <Button
            onClick={() => deletePositionMutation.mutate(candidate.id)}
            loading={deletePositionMutation.isLoading}
            variant="ghost"
            color="red"
            size="sm"
            w="fit-content"
          >
            Delete
          </Button>
        </Flex>
      </Group>
    </>
  );
};

export default CandidateCard;
