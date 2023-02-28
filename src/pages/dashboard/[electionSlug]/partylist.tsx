import { Button, Container, Flex, Text, useDisclosure } from "@chakra-ui/react";
import { useRouter } from "next/router";
import CreatePartylistModal from "../../../components/modals/CreatePartylist";
import PartylistCard from "../../../components/PartylistCard";
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
        onClose={onClose}
        electionId={partylists.data.election.id}
        refetch={partylists.refetch}
      />
      <Button onClick={onOpen} mb={4}>
        Add partylist
      </Button>

      <Flex gap={4} flexWrap="wrap">
        {!partylists.data.partylists.length ? (
          <Text>No partylist</Text>
        ) : (
          partylists.data.partylists.map((partylist) => (
            <PartylistCard
              key={partylist.id}
              partylist={partylist}
              refetch={partylists.refetch}
            />
          ))
        )}
      </Flex>
    </Container>
  );
};

export default DashboardPartylist;
