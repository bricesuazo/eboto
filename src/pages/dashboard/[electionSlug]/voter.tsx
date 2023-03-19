import {
  Button,
  Text,
  Table,
  TextInput,
  Flex,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconSearch } from "@tabler/icons-react";
import { useRouter } from "next/router";
import CreateVoterModal from "../../../components/modals/CreateVoter";
import Voter from "../../../components/Voter";
import { api } from "../../../utils/api";

const DashboardVoter = () => {
  const router = useRouter();
  const [opened, { open, close }] = useDisclosure(false);

  const voters = api.election.getElectionVoter.useQuery(
    router.query.electionSlug as string,
    {
      enabled: router.isReady,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
    }
  );

  if (voters.isLoading) return <Text>Loading...</Text>;

  if (voters.isError) return <Text>Error: {voters.error.message}</Text>;

  if (!voters.data) return <Text>No election found</Text>;

  return (
    <>
      <CreateVoterModal
        isOpen={opened}
        electionId={voters.data.election.id}
        onClose={close}
        refetch={voters.refetch}
      />

      <Flex columnGap="sm">
        <Button onClick={open}>Add voter</Button>
        <TextInput
          placeholder="Search by any field"
          mb="md"
          icon={<IconSearch size="0.9rem" stroke={1.5} />}
          // value={search}
          // onChange={handleSearchChange}
          sx={{
            flex: 1,
          }}
        />
      </Flex>

      <Table striped highlightOnHover withBorder>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {voters.data.voters.map((voter) => (
            <Voter
              key={voter.id}
              electionId={voters.data.election.id}
              voter={voter}
              refetch={voters.refetch}
            />
          ))}
        </tbody>
      </Table>
    </>
  );
};

export default DashboardVoter;
