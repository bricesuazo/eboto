import { Button, Container, Group, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useRouter } from "next/router";
import ElectionDashboardHeader from "../../../components/ElectionDashboardHeader";
import CreatePartylistModal from "../../../components/modals/CreatePartylist";
import PartylistCard from "../../../components/PartylistCard";
import { api } from "../../../utils/api";

const DashboardPartylist = () => {
  const router = useRouter();
  const [opened, { open, close }] = useDisclosure(false);

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
    <Container maw="4xl">
      <CreatePartylistModal
        isOpen={opened}
        onClose={close}
        electionId={partylists.data.election.id}
        refetch={partylists.refetch}
      />
      <ElectionDashboardHeader slug={partylists.data.election.slug} />
      <Button onClick={open} mb={16}>
        Add partylist
      </Button>

      <Group>
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
      </Group>
    </Container>
  );
};

export default DashboardPartylist;
