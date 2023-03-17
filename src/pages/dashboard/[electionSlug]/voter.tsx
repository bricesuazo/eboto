import { Button, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
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

      <Button onClick={open}>Add voter</Button>
      <Text>{voters.data.election.name} - voter page</Text>

      {voters.data.voters.map((voter) => (
        <Voter
          key={voter.id}
          electionId={voters.data.election.id}
          voter={voter}
          refetch={voters.refetch}
        />
      ))}
    </>
  );
};

export default DashboardVoter;
