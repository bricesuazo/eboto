import { Button, Text, Group } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import type { Candidate, Partylist, Position } from "@prisma/client";
import CandidateCard from "./CandidateCard";
import CreateCandidateModal from "./modals/CreateCandidate";

const Candidates = ({
  position,
  refetch,
  candidates,
  partylists,
  positions,
}: {
  position: Position;
  refetch: () => Promise<unknown>;
  candidates: Candidate[];
  partylists: Partylist[];
  positions: Position[];
}) => {
  const [opened, { open, close }] = useDisclosure(false);
  return (
    <>
      <CreateCandidateModal
        isOpen={opened}
        onClose={close}
        position={position}
        positions={positions}
        refetch={refetch}
        partylists={partylists}
      />

      <Text weight="bold" size="xl" mb={2}>
        {position.name}
      </Text>
      <Button onClick={open} mb={4}>
        Add candidate
      </Button>

      <Group>
        {!candidates.length ? (
          <Text>No candidates yet</Text>
        ) : (
          candidates.map((candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              refetch={refetch}
              positions={positions}
              partylists={partylists}
            />
          ))
        )}
      </Group>
    </>
  );
};

export default Candidates;
