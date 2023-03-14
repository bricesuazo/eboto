import { Box, Button, Group, Skeleton, Stack, Text } from "@mantine/core";
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

  if (positions.isError) return <Text>Error</Text>;

  return (
    <>
      <Stack>
        <Box>
          <Button
            sx={(theme) => ({
              [theme.fn.smallerThan("xs")]: { width: "100%" },
            })}
            onClick={open}
          >
            Add position
          </Button>
        </Box>

        <Group spacing="xs">
          {positions.isLoading ? (
            <>
              {[...Array(7).keys()].map((i) => (
                <Skeleton
                  key={i}
                  sx={(theme) => ({
                    width: 200,
                    height: 128,
                    borderRadius: theme.radius.md,

                    [theme.fn.smallerThan("xs")]: { width: "100%" },
                  })}
                />
              ))}
            </>
          ) : !positions.data.positions.length ? (
            <Text>No position</Text>
          ) : (
            <>
              <CreatePositionModal
                isOpen={opened}
                onClose={close}
                electionId={positions.data.election.id}
                order={positions.data.positions.length}
                refetch={positions.refetch}
              />

              {positions.data.positions.map((position) => (
                <Position
                  key={position.id}
                  position={position}
                  refetch={positions.refetch}
                />
              ))}
            </>
          )}
        </Group>
      </Stack>
    </>
  );
};

export default DashboardPosition;
