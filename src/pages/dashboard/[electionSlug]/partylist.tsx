import { Button, Container, Flex, Text, useDisclosure } from "@chakra-ui/react";
import { useRouter } from "next/router";
import CreatePartylistModal from "../../../components/modals/CreatePartylist";
import Partylist from "../../../components/PartylistCard";
import { api } from "../../../utils/api";

const DashboardPartylist = () => {
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const partylists = api.partylist.getAll.useQuery(
    router.query.electionSlug as string,
    {
      enabled: router.isReady,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: false,
    }
  );

  if (partylists.isLoading) return <Text>Loading...</Text>;

  if (partylists.isError) return <Text>Error</Text>;

  return (
    <Container maxW="4xl">
      <CreatePartylistModal
        isOpen={isOpen}
        onClose={async () => {
          await partylists.refetch();
          onClose();
        }}
        electionId={partylists.data.election.id}
      />
      <Button onClick={onOpen} mb={4}>
        Add partylist
      </Button>

      <Flex gap={4} flexWrap="wrap">
        {!partylists.data.partylists.length ? (
          <Text>No partylist</Text>
        ) : (
          partylists.data.partylists.map((partylist) => (
            <Partylist
              key={partylist.id}
              partylist={partylist}
              refetch={async () => await partylists.refetch()}
            />
          ))
        )}
      </Flex>
    </Container>
  );
};

export default DashboardPartylist;
