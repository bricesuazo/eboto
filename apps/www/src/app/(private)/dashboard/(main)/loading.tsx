import Dashboard from "@/components/client/layout/dashboard";
import CreateElection from "@/components/client/modals/create-election";
import {
  Box,
  Container,
  Flex,
  Group,
  Skeleton,
  Stack,
  Text,
  Title,
} from "@mantine/core";

export default function DashboardLoading() {
  return (
    <Dashboard>
      <Container p="md" size="md">
        <Stack gap="xl">
          <Box hiddenFrom="xs">
            <CreateElection style={{ width: "100%" }} />
          </Box>
          <Box>
            <Flex align="center" justify="space-between">
              <Title order={2}>My elections</Title>

              <Box visibleFrom="xs">
                <CreateElection />
              </Box>
            </Flex>
            <Text size="sm" c="grayText" mb="md">
              You can manage the elections below.
            </Text>
            <Group>
              {[...Array(3).keys()].map((i) => (
                <Skeleton key={i} maw={288} h={400} radius="md" />
              ))}
            </Group>
          </Box>

          <Box>
            <Title order={2}>My elections I can vote in</Title>

            <Text size="sm" c="grayText" mb="sm">
              You can vote in the elections below. You can only vote once per
              election.
            </Text>

            <Group>
              {[...Array(3).keys()].map((i) => (
                <Skeleton key={i} maw={288} h={400} radius="md" />
              ))}
            </Group>
          </Box>
        </Stack>
      </Container>
    </Dashboard>
  );
}
