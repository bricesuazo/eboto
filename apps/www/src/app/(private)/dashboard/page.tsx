import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import ElectionsLeft from "@/components/elections-left";
import Dashboard from "@/components/layout/dashboard";
import CreateElection from "@/components/modals/create-election";
import {
  MyElectionsAsCommissioner as MyElectionsAsCommissionerClient,
  MyElectionsAsVoter as MyElectionsAsVoterClient,
} from "@/components/my-elections";
import { api } from "@/trpc/server";
import { supabase } from "@/utils/supabase/server";
import {
  Box,
  Center,
  Container,
  Flex,
  Group,
  Skeleton,
  Stack,
  Text,
  Title,
} from "@mantine/core";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "eBoto | Dashboard",
};

export default async function Page() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/sign-in");

  return (
    <Dashboard>
      <Container size="md" my="md">
        <Stack gap="xl">
          <Flex direction="column" gap="sm" hiddenFrom="xs">
            <CreateElection style={{ width: "100%" }} />
            <Center>
              <ElectionsLeft />
            </Center>
          </Flex>
          <Box>
            <Flex align="center" justify="space-between">
              <Title order={2}>My elections</Title>

              <Flex gap="xs" visibleFrom="xs" align="center">
                <ElectionsLeft />
                <CreateElection />
              </Flex>
            </Flex>

            <Text size="sm" c="grayText" mb="md">
              You can manage the elections below.
            </Text>
            <Group>
              <Suspense
                fallback={
                  <>
                    {[...Array(3).keys()].map((i) => (
                      <Skeleton key={i} maw={288} h={400} radius="md" />
                    ))}
                  </>
                }
              >
                <MyElectionsAsCommissioner />
              </Suspense>
            </Group>
          </Box>

          <Box>
            <Title order={2}>My elections I can vote in</Title>

            <Text size="sm" c="grayText" mb="sm">
              You can vote in the elections below. You can only vote once per
              election.
            </Text>

            <Group>
              <Suspense
                fallback={
                  <>
                    {[...Array(3).keys()].map((i) => (
                      <Skeleton key={i} maw={288} h={400} radius="md" />
                    ))}
                  </>
                }
              >
                <MyElectionsAsVoter />
              </Suspense>
            </Group>
          </Box>
        </Stack>
      </Container>
    </Dashboard>
  );
}

async function MyElectionsAsCommissioner() {
  const electionsAsCommissioner =
    await api.election.getMyElectionAsCommissioner.query();

  return (
    <MyElectionsAsCommissionerClient initialData={electionsAsCommissioner} />
  );
}
async function MyElectionsAsVoter() {
  const electionsAsVoter = await api.election.getMyElectionAsVoter.query();
  return <MyElectionsAsVoterClient initialData={electionsAsVoter} />;
}
