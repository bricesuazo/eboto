import { Box, Button, Container, Text, useDisclosure } from "@chakra-ui/react";
import { useRouter } from "next/router";
import CreatePartylistModal from "../../../components/modals/CreatePartylist";
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
      <Button onClick={onOpen}>Add partylist</Button>

      <Box>
        {partylists.data.partylists.map((partylist) => (
          <Text key={partylist.id}>{partylist.name}</Text>
        ))}
      </Box>
    </Container>
  );
};

export default DashboardPartylist;
