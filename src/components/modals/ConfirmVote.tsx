import {
  Box,
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  useToast,
} from "@chakra-ui/react";
import type { Candidate, Election, Partylist, Position } from "@prisma/client";
import { useRouter } from "next/router";
import { api } from "../../utils/api";

interface ConfirmVoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  election: Election & {
    candidates: Candidate[];
    positions: Position[];
    partylists: Partylist[];
  };
  selectedCandidates: string[];
}

const ConfirmVote = ({
  isOpen,
  onClose,
  election,
  selectedCandidates,
}: ConfirmVoteModalProps) => {
  const router = useRouter();
  const toast = useToast();
  const voteMutation = api.election.vote.useMutation({
    onSuccess: async () => {
      await router.push(`/${election.slug}/realtime`);
      onClose();
      toast({
        title: "Vote casted successfully!",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    },
    onError: (error) => {
      toast({
        title: "Error casting vote",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    },
  });

  return (
    <Modal
      isOpen={isOpen || voteMutation.isLoading}
      onClose={onClose}
      size={["xs", "md"]}
    >
      <ModalOverlay />
      <ModalContent marginX={[2, 0]}>
        <ModalHeader
        // display="flex"
        // alignItems="center"
        // gap={2}
        // paddingX={[4, 6]}
        >
          {/* <FingerPrintIcon width={28} /> */}
          <Text fontSize={["lg", "xl"]}>Confirm Vote</Text>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody paddingX={[4, 6]}>
          {election.positions.map((position) => {
            const candidate = election.candidates.find(
              (candidate) =>
                candidate.id ===
                selectedCandidates
                  .find(
                    (selectedCandidate) =>
                      selectedCandidate.split("-")[0] === position.id
                  )
                  ?.split("-")[1]
            );

            const partylist = election.partylists.find(
              (partylist) => partylist.id === candidate?.partylistId
            );

            return (
              <Box key={position.id} mb={[2, 4]}>
                <Text fontSize="sm" color="gray.500">
                  {position.name}
                </Text>
                <Text fontSize={["md", "lg"]} fontWeight="bold">
                  {candidate
                    ? `${candidate.last_name}, ${candidate.first_name}${
                        candidate.middle_name ? ` ${candidate.middle_name}` : ""
                      }${partylist ? ` (${partylist.acronym})` : ""}`
                    : "Abstain"}
                </Text>
              </Box>
            );
          })}
        </ModalBody>

        <ModalFooter>
          <Button
            size={["sm", "md"]}
            variant="ghost"
            mr={3}
            onClick={onClose}
            isDisabled={voteMutation.isLoading}
          >
            Cancel
          </Button>
          <Button
            size={["sm", "md"]}
            isLoading={voteMutation.isLoading}
            onClick={() =>
              voteMutation.mutate({
                electionId: election.id,
                votes: selectedCandidates,
              })
            }
          >
            Cast Vote
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ConfirmVote;
