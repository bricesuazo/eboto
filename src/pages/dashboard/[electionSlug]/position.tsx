import { Button, Group, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useRouter } from "next/router";
import CreatePositionModal from "../../../components/modals/CreatePosition";
import Position from "../../../components/Position";
import { api } from "../../../utils/api";

const DashboardPosition = () => {
  const router = useRouter();
  const [opened, { open, close }] = useDisclosure(false);

  const positions = api.position.getAll.useQuery(
    router.query.electionSlug as string,
    {
      enabled: router.isReady,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: false,
    }
  );

  if (positions.isLoading) return <Text>Loading...</Text>;

  if (positions.isError) return <Text>Error</Text>;

  return (
    <>
      <CreatePositionModal
        isOpen={opened}
        onClose={close}
        electionId={positions.data.election.id}
        order={positions.data.positions.length}
        refetch={positions.refetch}
      />
      <Button onClick={open} mb={4}>
        Add position
      </Button>

      <Group>
        {!positions.data.positions.length ? (
          <Text>No position</Text>
        ) : (
          positions.data.positions.map((position) => (
            <Position
              key={position.id}
              position={position}
              refetch={positions.refetch}
            />
          ))
        )}
      </Group>
    </>
  );
};

export default DashboardPosition;
