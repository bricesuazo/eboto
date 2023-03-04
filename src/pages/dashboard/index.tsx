import {
  Box,
  Button,
  Container,
  Flex,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import Link from "next/link";
import Moment from "react-moment";
import CreateElectionModal from "../../components/modals/CreateElection";
import { api } from "../../utils/api";
import { convertNumberToHour } from "../../utils/convertNumberToHour";

const DashboardPage = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const myElections = api.election.getMyElections.useQuery();
  const myElectionVote = api.election.getMyElectionsVote.useQuery();

  return (
    <>
      <CreateElectionModal isOpen={isOpen} onClose={onClose} />
      <Container maxW="4xl">
        <Button onClick={onOpen}>Create election</Button>

        <Text>My elections</Text>
        <Flex gap={2}>
          {!myElections.data || myElections.isLoading ? (
            <Text>Loading...</Text>
          ) : myElections.data.length === 0 ? (
            <Text>No elections found</Text>
          ) : (
            myElections.data.map((election) => (
              <Link href={`/dashboard/${election.slug}`} key={election.id}>
                <Box
                  _dark={{
                    bg: "gray.700",
                    _hover: {
                      bg: "gray.600",
                    },
                  }}
                  bg="gray.100"
                  _hover={{ bg: "gray.200" }}
                  transition="all 0.2s"
                  px={4}
                  py={2}
                  borderRadius="md"
                >
                  <Text fontWeight="bold">{election.name}</Text>
                  <Text fontSize="sm" color="GrayText">
                    <Moment format="YYYY/MM/D hA">{election.start_date}</Moment>
                    {" - "}
                    <Moment format="YYYY/MM/D hA">{election.end_date}</Moment>
                  </Text>
                </Box>
              </Link>
            ))
          )}
        </Flex>

        <Text>My votes</Text>
        <Flex gap={2}>
          {!myElectionVote.data || myElectionVote.isLoading ? (
            <Text>Loading...</Text>
          ) : myElectionVote.data.length === 0 ? (
            <Text>No vote elections found</Text>
          ) : (
            myElectionVote.data?.map((election) => (
              <Link
                href={`/${election.slug}`}
                key={election.id}
                target="_blank"
              >
                <Box
                  _dark={{
                    bg: "gray.700",
                    _hover: {
                      bg: "gray.600",
                    },
                  }}
                  bg="gray.100"
                  _hover={{ bg: "gray.200" }}
                  transition="all 0.2s"
                  px={4}
                  py={2}
                  borderRadius="md"
                >
                  <Text fontWeight="bold">{election.name}</Text>
                  <Text fontSize="sm" color="GrayText">
                    <Moment format="YYYY/MM/D hA">{election.start_date}</Moment>
                    {" - "}
                    <Moment format="YYYY/MM/D hA">{election.end_date}</Moment>
                  </Text>
                  <Text fontSize="sm" color="GrayText">
                    Open from {convertNumberToHour(election.voting_start)} -{" "}
                    {convertNumberToHour(election.voting_end)}
                  </Text>
                </Box>
              </Link>
            ))
          )}
        </Flex>
      </Container>
    </>
  );
};

export default DashboardPage;
