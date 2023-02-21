import { Button, Container, Text, useDisclosure } from "@chakra-ui/react";
import { useRouter } from "next/router";
import CreateVoterModal from "../../../components/modals/CreateVoter";
import { api } from "../../../utils/api";

const DashboardVoter = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const router = useRouter();

  if (typeof router.query.electionSlug !== "string") return null;

  const election = api.election.getBySlug.useQuery(router.query.electionSlug);

  if (election.isLoading) return <Text>Loading...</Text>;

  if (election.isError) return <Text>Error: {election.error.message}</Text>;

  if (!election.data) return <Text>No election found</Text>;
  return (
    <Container maxW="4xl">
      <CreateVoterModal
        isOpen={isOpen}
        onClose={onClose}
        electionId={election.data.id}
      />
      <Button onClick={onOpen}>Add voter</Button>
      <Text>Voter</Text>
    </Container>
  );
};

export default DashboardVoter;
