import { Box, Button, Group, Skeleton, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useRouter } from "next/router";
import CreatePositionModal from "../../../components/modals/CreatePosition";
import Position from "../../../components/Position";
import { api } from "../../../utils/api";
import { IconReplace } from "@tabler/icons-react";
import Head from "next/head";

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

  return (
    <>
      <Head>
        <title>Positions | eBoto Mo</title>
      </Head>
      <Stack p="md">
        <Box>
          <Button
            sx={(theme) => ({
              [theme.fn.smallerThan("xs")]: { width: "100%" },
            })}
            onClick={open}
            loading={positions.isLoading}
            leftIcon={<IconReplace size="1rem" />}
          >
            Add position
          </Button>
        </Box>

        {positions.data && (
          <>
            <Head>
              <title>
                {positions.data.election.name} &ndash; Positions | eBoto Mo
              </title>
            </Head>
            <CreatePositionModal
              isOpen={opened}
              onClose={close}
              electionId={positions.data.election.id}
              order={positions.data.positions.length}
            />
          </>
        )}

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
          ) : positions.error ? (
            <Text>Error</Text>
          ) : !positions.data.positions.length ? (
            <Text>No position</Text>
          ) : (
            <>
              {positions.data.positions.map((position) => (
                <Position key={position.id} position={position} />
              ))}
            </>
          )}
        </Group>
      </Stack>
    </>
  );
};

export default DashboardPosition;
