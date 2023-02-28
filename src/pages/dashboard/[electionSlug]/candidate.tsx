import { Container, Flex, Text, useDisclosure, Button } from "@chakra-ui/react";
import { useRouter } from "next/router";
import CandidateCard from "../../../components/Candidate";
import CreateCandidateModal from "../../../components/modals/CreateCandidate";
import { api } from "../../../utils/api";

const CandidatePartylist = () => {
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const candidates = api.candidate.getAll.useQuery(
    router.query.electionSlug as string,
    {
      enabled: router.isReady,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: false,
    }
  );

  if (candidates.isLoading) return <Text>Loading...</Text>;

  if (candidates.isError) return <Text>Error</Text>;

  return (
    <Container maxW="4xl">
      <CreateCandidateModal
        isOpen={isOpen}
        onClose={async () => {
          await candidates.refetch();
          onClose();
        }}
        electionId={candidates.data.election.id}
        order={candidates.data.candidates.length}
      />
      <Button onClick={onOpen} mb={4}>
        Add candidate
      </Button>

      <Flex gap={4} flexWrap="wrap">
        {!candidates.data.candidates ? (
          <Text>No position</Text>
        ) : (
          candidates.data.candidates.map((candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              refetch={async () => await candidates.refetch()}
            />
          ))
        )}
      </Flex>
    </Container>
  );
};

export default CandidatePartylist;
