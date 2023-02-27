import { Button, Container, Flex, Text, useDisclosure } from "@chakra-ui/react";
import { useRouter } from "next/router";
import CreatePositionModal from "../../../components/modals/CreatePosition";
import Position from "../../../components/Position";
import { api } from "../../../utils/api";

const DashboardPosition = () => {
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();

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
    <Container maxW="4xl">
      <CreatePositionModal
        isOpen={isOpen}
        onClose={async () => {
          await positions.refetch();
          onClose();
        }}
        electionId={positions.data.election.id}
        order={positions.data.positions.length}
      />
      <Button onClick={onOpen} mb={4}>
        Add position
      </Button>

      <Flex gap={4} flexWrap="wrap">
        {!positions.data.positions.length ? (
          <Text>No position</Text>
        ) : (
          positions.data.positions.map((position) => (
            <Position
              key={position.id}
              position={position}
              refetch={async () => await positions.refetch()}
            />
          ))
        )}
      </Flex>
    </Container>
  );
};

export default DashboardPosition;
