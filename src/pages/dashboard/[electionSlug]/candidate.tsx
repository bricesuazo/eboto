import { Stack, Text, Center, Loader, Box } from "@mantine/core";
import Head from "next/head";
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

  return (
    <Box p="md" h="100%">
      {candidates.isLoading ? (
        <Center h="100%">
          <Loader size="lg" />
        </Center>
      ) : candidates.isError ? (
        <Text>Error</Text>
      ) : !candidates.data ? (
        <Text>No data</Text>
      ) : (
        <>
          <Head>
            <title>
              {candidates.data.election.name + " — Candidates | eBoto Mo"}
            </title>
          </Head>
          <Stack spacing="lg">
            {candidates.data.positions.length === 0 ? (
              <Text>No positions yet</Text>
            ) : (
              candidates.data.positions.map((position) => {
                return (
                  <Candidates
                    key={position.id}
                    position={position}
                    partylists={candidates.data.partylists}
                    positions={candidates.data.positions}
                    candidates={
                      candidates.data.candidates.filter
                        ? candidates.data.candidates.filter(
                            (candidate) => candidate.positionId === position.id
                          )
                        : []
                    }
                  />
                );
              })
            )}
          </Stack>
        </>
      )}
    </Box>
  );
};

export default CandidatePartylist;
