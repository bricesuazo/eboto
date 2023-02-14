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
} from "@chakra-ui/react";
import { FingerPrintIcon } from "@heroicons/react/24/outline";
import { doc, increment, updateDoc } from "firebase/firestore";
import { useRouter } from "next/router";
import { useState } from "react";
import { firestore } from "../firebase/firebase";
import {
  candidateType,
  electionType,
  partylistType,
  positionType,
} from "../types/typings";

interface ConfirmVoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  election: electionType;
  partylists: partylistType[];
  positions: positionType[];
  candidates: candidateType[];
  selectedCandidates: string[];
  voterUid: string;
}
const ConfirmVoteModal = ({
  isOpen,
  onClose,
  election,
  partylists,
  positions,
  candidates,
  selectedCandidates,
  voterUid,
}: ConfirmVoteModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size={["xs", "md"]}>
      <ModalOverlay>
        <ModalContent marginX={[2, 0]}>
          <ModalHeader
            display="flex"
            alignItems="center"
            gap={2}
            paddingX={[4, 6]}
          >
            <FingerPrintIcon width={28} />
            <Text fontSize={["lg", "xl"]}>Confirm Vote</Text>
          </ModalHeader>
          <ModalCloseButton />

          <ModalBody paddingX={[4, 6]}>
            {positions.map((position) => {
              const candidate = candidates.find(
                (candidate) =>
                  candidate.uid ===
                  selectedCandidates
                    .find(
                      (selectedCandidate) =>
                        selectedCandidate.split("-")[0] === position.uid
                    )
                    ?.split("-")[1]
              );
              return (
                <Box key={position.uid} mb={[2, 4]}>
                  <Text fontSize="sm" color="gray.500">
                    {position.title}
                  </Text>
                  <Text fontSize={["md", "lg"]} fontWeight="bold">
                    {candidate
                      ? `${candidate.lastName}, ${candidate.firstName}${
                          candidate.middleName && ` ${candidate.middleName}`
                        } (${
                          partylists.find(
                            (partylist) => partylist.uid === candidate.partylist
                          )?.abbreviation
                        })`
                      : "Undecided"}
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
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              isLoading={isSubmitting}
              size={["sm", "md"]}
              onClick={() => {
                selectedCandidates.forEach(async (selectedCandidate) => {
                  setIsSubmitting(true);
                  const [positionUid, candidateUid] =
                    selectedCandidate.split("-");

                  if (candidateUid === "abstain") {
                    await updateDoc(
                      doc(
                        firestore,
                        "elections",
                        election.uid,
                        "positions",
                        positionUid
                      ),
                      {
                        undecidedVotingCount: increment(1),
                      }
                    );
                  } else {
                    await updateDoc(
                      doc(
                        firestore,
                        "elections",
                        election.uid,
                        "candidates",
                        candidateUid
                      ),
                      {
                        votingCount: increment(1),
                      }
                    );
                  }
                  await updateDoc(
                    doc(
                      firestore,
                      "elections",
                      election.uid,
                      "voters",
                      voterUid
                    ),
                    {
                      hasVoted: true,
                    }
                  );
                  setIsSubmitting(false);
                  onClose();
                  router.push(`/${election.electionIdName}/realtime`);
                });
              }}
            >
              Cast Vote
            </Button>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};

export default ConfirmVoteModal;
