import { Box, Button, Container, Flex, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import Link from "next/link";
import Moment from "react-moment";
import CreateElectionModal from "../../components/modals/CreateElection";
import { api } from "../../utils/api";
import { convertNumberToHour } from "../../utils/convertNumberToHour";

const DashboardPage = () => {
  const [opened, { open, close }] = useDisclosure(false);
  const myElections = api.election.getMyElections.useQuery();
  const myElectionVote = api.election.getMyElectionsVote.useQuery();

  return (
    <>
      <CreateElectionModal isOpen={opened} onClose={close} />
      <Container maw="4xl">
        <Button onClick={open}>Create election</Button>

        <Text>My elections</Text>
        <Flex gap={2}>
          {!myElections.data || myElections.isLoading ? (
            <Text>Loading...</Text>
          ) : myElections.data.length === 0 ? (
            <Text>No elections found</Text>
          ) : (
            myElections.data.map((election) => (
              <Link href={`/dashboard/${election.slug}`} key={election.id}>
                <Box px={4} py={2}>
                  <Text weight="bold">{election.name}</Text>
                  <Text size="sm" color="GrayText">
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
                <Box px={4} py={2}>
                  <Text weight="bold">{election.name}</Text>
                  <Text size="sm" color="GrayText">
                    <Moment format="YYYY/MM/D hA">{election.start_date}</Moment>
                    {" - "}
                    <Moment format="YYYY/MM/D hA">{election.end_date}</Moment>
                  </Text>
                  <Text size="sm" color="GrayText">
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
