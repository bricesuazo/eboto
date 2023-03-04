import { Button, Group, Modal, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import type { Candidate, Election, Partylist, Position } from "@prisma/client";
import { IconCheck, IconX } from "@tabler/icons-react";
import { useRouter } from "next/router";
import { useConfetti } from "../../lib/confetti";
import { api } from "../../utils/api";

interface ConfirmVoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  election: Election;
  selectedCandidates: string[];
  positions: (Position & {
    candidate: (Candidate & {
      partylist: Partylist;
    })[];
  })[];
}

const ConfirmVote = ({
  isOpen,
  onClose,
  election,
  positions,
  selectedCandidates,
}: ConfirmVoteModalProps) => {
  const router = useRouter();
  const { fireConfetti } = useConfetti();

  const voteMutation = api.election.vote.useMutation({
    onSuccess: async () => {
      await router.push(`/${election.slug}/realtime`);
      onClose();
      notifications.show({
        title: "Vote casted successfully!",
        message: "You can now view the realtime results",
        icon: <IconCheck size="1.1rem" />,
        autoClose: 5000,
      });
      await fireConfetti();
    },
    onError: (error) => {
      notifications.show({
        title: "Error casting vote",
        message: error.message,
        icon: <IconX size="1.1rem" />,
        color: "red",
        autoClose: 5000,
      });
    },
  });

  return (
    <Modal
      opened={isOpen || voteMutation.isLoading}
      onClose={close}
      title="Confirm Vote"
    >
      {positions.map((position) => {
        const candidate = position.candidate.find(
          (candidate) =>
            candidate.id ===
            selectedCandidates
              .find(
                (selectedCandidate) =>
                  selectedCandidate.split("-")[0] === position.id
              )
              ?.split("-")[1]
        );

        return (
          <Group key={position.id}>
            <Text size="sm" color="gray.500">
              {position.name}
            </Text>
            <Text weight="bold">
              {candidate
                ? `${candidate.last_name}, ${candidate.first_name}${
                    candidate.middle_name ? ` ${candidate.middle_name}` : ""
                  } (${candidate.partylist.acronym})`
                : "Abstain"}
            </Text>
          </Group>
        );
      })}

      <Group>
        <Button onClick={onClose} disabled={voteMutation.isLoading}>
          Cancel
        </Button>
        <Button
          loading={voteMutation.isLoading}
          onClick={() =>
            voteMutation.mutate({
              electionId: election.id,
              votes: selectedCandidates,
            })
          }
        >
          Cast Vote
        </Button>
      </Group>
    </Modal>
  );
};

export default ConfirmVote;
