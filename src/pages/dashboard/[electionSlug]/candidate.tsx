import { Stack, Text, Center, Loader, Box, Anchor } from "@mantine/core";
import Head from "next/head";
import { useRouter } from "next/router";
import Candidates from "../../../components/Candidates";
import { api } from "../../../utils/api";
import Link from "next/link";

const CandidatePartylist = () => {
  const router = useRouter();

  const candidates = api.candidate.getAll.useQuery(
    router.query.electionSlug as string,
    {
      enabled: router.isReady,
    }
  );

  return (
    <>
      <Head>
        <title>Candidates | eBoto Mo</title>
      </Head>
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
                {candidates.data.election.name} &ndash; Candidates | eBoto Mo
              </title>
            </Head>
            <Stack spacing="lg">
              {candidates.data.positions.length === 0 ? (
                <Box>
                  <Text>
                    No positions yet. Please add{" "}
                    <Anchor
                      component={Link}
                      href={`/dashboard/${candidates.data.election.slug}/position`}
                    >
                      positions
                    </Anchor>{" "}
                    first.
                  </Text>
                </Box>
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
                              (candidate) =>
                                candidate.positionId === position.id
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
    </>
  );
};

export default CandidatePartylist;
