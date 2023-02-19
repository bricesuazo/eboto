import { Button, Container, useDisclosure } from "@chakra-ui/react";
import CreateElectionModal from "../../emails/components/modals/CreateElection";

const DashboardPage = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  // const myElections = api.election.getMyElections.useQuery(undefined, {
  //   refetchOnWindowFocus: false,
  //   refetchOnMount: false,
  //   refetchOnReconnect: false,
  // });

  return (
    <Container maxW="4xl">
      <Button onClick={onOpen}>Create election</Button>
      <CreateElectionModal isOpen={isOpen} onClose={onClose} />
    </Container>
  );
};

export default DashboardPage;
