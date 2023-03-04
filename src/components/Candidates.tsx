import { Button, Text, useDisclosure } from "@chakra-ui/react";
import type { Candidate, Partylist, Position } from "@prisma/client";
import CandidateCard from "./CandidateCard";
import CreateCandidateModal from "./modals/CreateCandidate";

const Candidates = ({
  position,
  refetch,
  candidates,
  partylists,
}: {
  position: Position;
  refetch: () => Promise<unknown>;
  candidates: Candidate[];
  partylists: Partylist[];
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  return (
    <>
      <CreateCandidateModal
        isOpen={isOpen}
        onClose={onClose}
        position={position}
        refetch={refetch}
        partylists={partylists}
      />

      <Text fontWeight="bold" fontSize="xl" mb={2}>
        {position.name}
      </Text>
      <Button onClick={onOpen} mb={4}>
        Add candidate
      </Button>

      {!candidates.length ? (
        <Text>No candidates yet</Text>
      ) : (
        candidates.map((candidate) => (
          <CandidateCard
            key={candidate.id}
            candidate={candidate}
            refetch={refetch}
            partylists={partylists}
          />
        ))
      )}
    </>
  );
};

export default Candidates;
