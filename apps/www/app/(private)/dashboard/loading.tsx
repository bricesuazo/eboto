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
        <Stack gap="lg">
          <Box>
            <Flex align="center" justify="space-between">
              <Title order={2} visibleFrom="xs">
                My elections
              </Title>
              <Title order={4} hiddenFrom="xs">
                My elections
              </Title>

              <CreateElection />
            </Flex>
            <Text size="xs" c="grayText" mb="md" hiddenFrom="xs">
              You can manage the elections below.
            </Text>
            <Text size="sm" c="grayText" mb="md" visibleFrom="xs">
              You can manage the elections below.
            </Text>
            <Group>
              {[...Array(3).keys()].map((i) => (
                <Skeleton
                  key={i}
                  w={{ base: "100%", xs: 256 }}
                  h={300}
                  radius="md"
                />
              ))}
            </Group>
          </Box>

          <Box>
            <Title order={2} visibleFrom="xs">
              My elections I can vote in
            </Title>
            <Title order={4} hiddenFrom="xs">
              My elections I can vote in
            </Title>

            <Text size="xs" c="grayText" mb="sm" hiddenFrom="xs">
              You can vote in the elections below. You can only vote once per
              election.
            </Text>
            <Text size="sm" c="grayText" mb="md" visibleFrom="xs">
              You can vote in the elections below. You can only vote once per
              election.
            </Text>

            <Group>
              {[...Array(3).keys()].map((i) => (
                <Skeleton
                  key={i}
                  w={{ base: "100%", xs: 256 }}
                  h={300}
                  radius="md"
                />
              ))}
            </Group>
          </Box>
        </Stack>
      </Container>
    </Dashboard>
  );
}