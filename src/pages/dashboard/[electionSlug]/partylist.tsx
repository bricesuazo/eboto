import { Box, Button, Group, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useRouter } from "next/router";
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
    <>
      <CreatePartylistModal
        isOpen={opened}
        onClose={close}
        electionId={partylists.data.election.id}
        refetch={partylists.refetch}
      />
      <Stack>
        <Box>
          <Button
            onClick={open}
            sx={(theme) => ({
              [theme.fn.smallerThan("xs")]: { width: "100%" },
            })}
          >
            Add partylist
          </Button>
        </Box>

        <Group spacing="xs">
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
      </Stack>
    </>
  );
};

export default DashboardPartylist;
