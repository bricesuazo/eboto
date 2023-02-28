import { Container, Text } from "@chakra-ui/react";
import { useRouter } from "next/router";
import Candidates from "../../../components/Candidates";
import { api } from "../../../utils/api";

const CandidatePartylist = () => {
  const router = useRouter();

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

  if (!candidates.data) return <Text>No data</Text>;

  return (
    <Container maxW="4xl">
      {candidates.data.positions.length === 0 ? (
        <Text>No positions yet</Text>
      ) : (
        candidates.data.positions.map((position) => {
          return (
            <Candidates
              key={position.id}
              position={position}
              partylists={candidates.data.partylists}
              candidates={
                candidates.data.candidates.filter
                  ? candidates.data.candidates.filter(
                      (candidate) => candidate.positionId === position.id
                    )
                  : []
              }
              refetch={async () => await candidates.refetch()}
            />
          );
        })
      )}
    </Container>
  );
};

export default CandidatePartylist;
