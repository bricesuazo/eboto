import {
  Box,
  Button,
  Center,
  Container,
  Stack,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useState } from "react";
import ConfirmVote from "../../components/modals/ConfirmVote";
import VotingPosition from "../../components/VotingPosition";
import { api } from "../../utils/api";

const VotePage = () => {
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const router = useRouter();

  const election = api.election.getElectionData.useQuery(
    router.query.electionSlug as string,
    {
      enabled: router.isReady,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      retry: false,
    }
  );

  if (!election.data) return <Text>Not found</Text>;

  return (
    <>
      <ConfirmVote
        isOpen={isOpen}
        onClose={onClose}
        election={election.data}
        selectedCandidates={selectedCandidates}
      />
      <Container>
        <Stack>
          {election.isLoading ? (
            <Text>Loading...</Text>
          ) : election.isError ? (
            <Text>Error: {election.error.message}</Text>
          ) : (
            election.data.positions.map((position) => {
              if (!election.data) return;

              return (
                <VotingPosition
                  key={position.id}
                  position={position}
                  candidates={election.data.candidates}
                  partylists={election.data.partylists}
                  setSelectedCandidates={setSelectedCandidates}
                />
              );
            })
          )}
        </Stack>

        {election.data && (
          <Center
            paddingX={[4, 0]}
            position="sticky"
            bottom={12}
            zIndex="sticky"
            marginTop={16}
          >
            <Button
              disabled={
                election.data.positions.length !== selectedCandidates.length
              }
              onClick={onOpen}
              variant="solid"
              // leftIcon={<FingerPrintIcon width={22} />}
              paddingY={8}
              borderRadius="full"
            >
              Cast Vote
            </Button>
          </Center>
        )}
      </Container>
    </>
  );
};

export default VotePage;
