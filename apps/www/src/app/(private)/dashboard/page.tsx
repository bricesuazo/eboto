import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Box,
  Center,
  Container,
  Flex,
  Group,
  Skeleton,
  Stack,
  Tabs,
  TabsList,
  TabsTab,
  Text,
  Title,
} from "@mantine/core";
import { IconArrowDown, IconArrowUp, IconX } from "@tabler/icons-react";

import ElectionsLeft from "~/components/elections-left";
import Dashboard from "~/components/layout/dashboard";
import CreateElection from "~/components/modals/create-election";
import {
  MyElectionsAsCommissioner as MyElectionsAsCommissionerClient,
  MyElectionsAsVoter as MyElectionsAsVoterClient,
} from "~/components/my-elections";
import { createClient } from "~/supabase/server";
import { api } from "~/trpc/server";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "eBoto | Dashboard",
};

export default async function Page({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await searchParamsPromise;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const manage = Array.isArray(searchParams.manage)
    ? searchParams.manage[0]
    : searchParams.manage;
  const vote = Array.isArray(searchParams.vote)
    ? searchParams.vote[0]
    : searchParams.vote;

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

            <Tabs
              defaultValue={
                (Array.isArray(searchParams.manage)
                  ? searchParams.manage[0]
                  : searchParams.manage) ?? "ongoing"
              }
              inverted
            >
              <Stack>
                <TabsList grow>
                  <TabsTab
                    value="ongoing"
                    leftSection={<IconArrowDown />}
                    component={Link}
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    href={`/dashboard?${
                      vote ? `vote=${vote}&` : ""
                    }manage=ongoing`}
                  >
                    Ongoing
                  </TabsTab>
                  <TabsTab
                    value="upcoming"
                    leftSection={<IconArrowUp />}
                    component={Link}
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    href={`/dashboard?${
                      vote ? `vote=${vote}&` : ""
                    }manage=upcoming`}
                  >
                    Upcoming
                  </TabsTab>
                  <TabsTab
                    value="ended"
                    leftSection={<IconX />}
                    component={Link}
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    href={`/dashboard?${
                      vote ? `vote=${vote}&` : ""
                    }manage=ended`}
                  >
                    Ended
                  </TabsTab>
                </TabsList>

                <Suspense
                  fallback={
                    <Group>
                      {[...Array(3).keys()].map((i) => (
                        <Skeleton key={i} maw={288} h={400} radius="md" />
                      ))}
                    </Group>
                  }
                >
                  <MyElectionsAsCommissioner />
                </Suspense>
              </Stack>
            </Tabs>
          </Box>

          <Box>
            <Title order={2}>My elections I can vote in</Title>

            <Text size="sm" c="grayText" mb="sm">
              You can vote in the elections below. You can only vote once per
              election.
            </Text>

            <Tabs
              defaultValue={
                (Array.isArray(searchParams.vote)
                  ? searchParams.vote[0]
                  : searchParams.vote) ?? "ongoing"
              }
              inverted
            >
              <Stack>
                <TabsList grow>
                  <TabsTab
                    value="ongoing"
                    leftSection={<IconArrowDown />}
                    component={Link}
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    href={`/dashboard?${
                      manage ? `manage=${manage}&` : ""
                    }vote=ongoing`}
                  >
                    Ongoing
                  </TabsTab>
                  <TabsTab
                    value="upcoming"
                    leftSection={<IconArrowUp />}
                    component={Link}
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    href={`/dashboard?${
                      manage ? `manage=${manage}&` : ""
                    }vote=upcoming`}
                  >
                    Upcoming
                  </TabsTab>
                  <TabsTab
                    value="ended"
                    leftSection={<IconX />}
                    component={Link}
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    href={`/dashboard?${
                      manage ? `manage=${manage}&` : ""
                    }vote=ended`}
                  >
                    Ended
                  </TabsTab>
                </TabsList>
                <Suspense
                  fallback={
                    <Group>
                      {[...Array(3).keys()].map((i) => (
                        <Skeleton key={i} maw={288} h={400} radius="md" />
                      ))}
                    </Group>
                  }
                >
                  <MyElectionsAsVoter />
                </Suspense>
              </Stack>
            </Tabs>
          </Box>
        </Stack>
      </Container>
    </Dashboard>
  );
}

async function MyElectionsAsCommissioner() {
  const electionsAsCommissioner =
    await api.election.getMyElectionAsCommissioner();

  return (
    <MyElectionsAsCommissionerClient initialData={electionsAsCommissioner} />
  );
}
async function MyElectionsAsVoter() {
  const electionsAsVoter = await api.election.getMyElectionAsVoter();
  return <MyElectionsAsVoterClient initialData={electionsAsVoter} />;
}
