import {
  Box,
  Button,
  Container,
  Group,
  Text,
  Title,
  Stack,
  Skeleton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus } from "@tabler/icons-react";
import DashboardCard from "../../components/DashboardCard";
import CreateElectionModal from "../../components/modals/CreateElection";
import { api } from "../../utils/api";

const DashboardPage = () => {
  const [opened, { open, close }] = useDisclosure(false);
  const myElections = api.election.getMyElections.useQuery();
  const myElectionVote = api.election.getMyElectionsVote.useQuery();

  return (
    <>
      <CreateElectionModal isOpen={opened} onClose={close} />
      <Container>
        <Stack spacing="xl">
          <Button
            onClick={open}
            variant="gradient"
            leftIcon={<IconPlus size="1.25rem" />}
            sx={(theme) => ({
              [theme.fn.largerThan("xs")]: { width: "fit-content" },
            })}
            size="md"
          >
            Create election
          </Button>

          <Box>
            <Title order={2}>My elections</Title>
            <Text
              size="xs"
              color="grayText"
              sx={(theme) => ({
                marginBottom: theme.spacing.xs,
              })}
            >
              You can manage the elections below.
            </Text>
            <Group spacing="xs">
              {!myElections.data || myElections.isLoading ? (
                [...Array(3).keys()].map((i) => (
                  <Skeleton
                    key={i}
                    width={264}
                    height={72}
                    radius="md"
                    sx={(theme) => ({
                      [theme.fn.smallerThan("xs")]: { width: "100%" },
                    })}
                  />
                ))
              ) : myElections.data.length === 0 ? (
                <Box h={72}>
                  <Text>No elections found</Text>
                </Box>
              ) : (
                myElections.data.map((election) => (
                  <DashboardCard
                    election={election}
                    key={election.id}
                    type="manage"
                  />
                ))
              )}
            </Group>
          </Box>

          <Box>
            <Title order={2}>My elections I can vote in</Title>
            <Text
              size="xs"
              color="grayText"
              sx={(theme) => ({
                marginBottom: theme.spacing.xs,
              })}
            >
              You can vote in the elections below. You can only vote once per
              election.
            </Text>

            <Group spacing="xs">
              {!myElectionVote.data || myElectionVote.isLoading ? (
                [...Array(3).keys()].map((i) => (
                  <Skeleton
                    key={i}
                    width={264}
                    height={72}
                    radius="md"
                    sx={(theme) => ({
                      [theme.fn.smallerThan("xs")]: { width: "100%" },
                    })}
                  />
                ))
              ) : myElectionVote.data.length === 0 ? (
                <Box h={72}>
                  <Text>No vote elections found</Text>
                </Box>
              ) : (
                myElectionVote.data.map((election) => (
                  <DashboardCard
                    election={election}
                    key={election.id}
                    type="vote"
                  />
                ))
              )}
            </Group>
          </Box>
        </Stack>
      </Container>
    </>
  );
};

export default DashboardPage;
