import {
  Button,
  Container,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
} from "@chakra-ui/react";
import { api } from "../utils/api";

const DashboardPage = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const createElectionMutation = api.election.create.useMutation();
  const myElections = api.election.getMyElections.useQuery(undefined, {
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
  console.log(
    "🚀 ~ file: DashboardPage.tsx:18 ~ DashboardPage ~ myElections",
    myElections.data
  );

  return (
    <Container maxW="4xl">
      <Button onClick={onOpen}>Create election</Button>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create election</ModalHeader>
          <ModalCloseButton />
          <form
            onSubmit={async () => {
              await createElectionMutation.mutateAsync({
                name: "asdasd",
                start_date: new Date(),
                end_date: new Date(),
                slug: "asdasd",
                voting_start: 7,
                voting_end: 12,
              });
              onClose();
            }}
          >
            <ModalBody>sadasd</ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={2} onClick={onClose}>
                Cancel
              </Button>
              <Button
                colorScheme="blue"
                type="submit"
                isLoading={createElectionMutation.isLoading}
              >
                Create
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default DashboardPage;
