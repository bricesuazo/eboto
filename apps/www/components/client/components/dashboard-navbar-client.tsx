"use client";

import CreateElection from "@/components/client/modals/create-election";
import { useStore } from "@/store";
import { useClerk } from "@clerk/nextjs";
import { electionDashboardNavbar } from "@eboto-mo/api/src/constants";
import type { Commissioner, Election } from "@eboto-mo/db/schema";
import { AppShellNavbar, Button, Divider, Select, Stack } from "@mantine/core";
import {
  IconExternalLink,
  IconFingerprint,
  IconLogout,
} from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";

export default function NavbarComponent() {
  const { signOut } = useClerk();
  const router = useRouter();
  const params = useParams();
  if (
    !params ??
    !params.electionDashboardSlug ??
    typeof params.electionDashboardSlug !== "string"
  )
    return null;
  const pathname = usePathname();

  // const {
  //   data: elections,
  //   isLoading,
  //   error,
  // } = api.election.getAllMyElections.query();
  // const elections = api.election.getAllMyElections.query();
  const elections: (Commissioner & { election: Election })[] = [];

  const currentElection = elections
    ? elections.find(
        (election) =>
          election.election.slug === params.electionDashboardSlug.toString(),
      )?.election
    : null;

  const store = useStore();

  return (
    <AppShellNavbar
      p="md"
      style={{
        overflow: "auto",
      }}
    >
      <Stack justify="space-between" h="100%">
        <Stack>
          <CreateElection style={{ width: "100%" }} />

          <Divider />

          <Stack gap="xs">
            <Select
              placeholder={
                // isLoading ? "Loading..." :
                "Select election"
              }
              leftSectionWidth={48}
              disabled={
                !elections
                // || isLoading
              }
              // error={error?.message}
              leftSection={
                currentElection?.logo ? (
                  <Image
                    src={currentElection?.logo}
                    alt={currentElection?.name}
                    width={28}
                    height={28}
                    priority
                  />
                ) : (
                  <IconFingerprint size={28} />
                )
              }
              size="md"
              data={
                elections
                  ? elections
                      .sort(
                        (a, b) =>
                          b.election.updated_at.getTime() -
                          a.election.updated_at.getTime(),
                      )
                      .filter(
                        ({ election }) =>
                          election.start_date < new Date() &&
                          election.end_date > new Date(),
                      )
                      .concat(
                        elections.filter(
                          ({ election }) =>
                            !(
                              election.start_date < new Date() &&
                              election.end_date > new Date()
                            ),
                        ),
                      )
                      .map(({ election }) => ({
                        label: election.name,
                        value: election.slug,
                        group:
                          election.start_date > new Date()
                            ? "Upcoming"
                            : election.end_date < new Date()
                            ? "Completed"
                            : "Ongoing",
                        selected:
                          election.slug ===
                          params.electionDashboardSlug.toString(),
                      }))
                  : []
              }
              // itemComponent={(props: React.ComponentPropsWithoutRef<"button">) => {
              //   const election = elections
              //     ? elections.find(({ election }) => election.slug === props.value)
              //         ?.election ?? null
              //     : null;
              //   if (!election) return null;
              //   return (
              //     <UnstyledButton
              //       {...props}
              //       h={48}
              //       style={(theme) => ({
              //         display: "flex",
              //         alignItems: "center",
              //         gap: theme.spacing.xs,
              //       })}
              //     >
              //       {election.logo ? (
              //         <Image
              //           src={election.logo}
              //           alt={election.name}
              //           width={20}
              //           height={20}
              //           priority
              //         />
              //       ) : (
              //         <IconFingerprint size={20} />
              //       )}
              //       <Text truncate size="sm">
              //         {election.name}
              //       </Text>
              //     </UnstyledButton>
              //   );
              // }}
              value={params.electionDashboardSlug?.toString() ?? undefined}
              onChange={(value) => {
                router.push(`/dashboard/${value ?? ""}`);
                store.toggleDashboardMenu(false);
              }}
            />

            <Button
              variant="outline"
              w="100%"
              rightSection={<IconExternalLink size="1rem" />}
              component={Link}
              href={`/${params.electionDashboardSlug?.toString()}`}
              target="_blank"
            >
              Visit election
            </Button>
            <Stack gap={4}>
              {electionDashboardNavbar.map((item) => (
                <Button
                  key={item.id}
                  component={Link}
                  justify="left"
                  color={
                    item.path === pathname?.split("/")[3] ? "green" : "gray"
                  }
                  fw="normal"
                  fz="sm"
                  href={`/dashboard/${params.electionDashboardSlug?.toString()}/${
                    item.path ?? ""
                  }`}
                  onClick={() => {
                    store.dashboardMenu && store.toggleDashboardMenu(false);
                  }}
                  variant={
                    item.path === pathname?.split("/")[3] ? "light" : "subtle"
                  }
                  size="md"
                  leftSection={<item.icon size="1.25rem" />}
                >
                  {item.label}
                </Button>
              ))}
            </Stack>
          </Stack>
        </Stack>

        <Stack>
          <Divider />

          <Button
            justify="left"
            color="red"
            fw="normal"
            fz="sm"
            size="md"
            variant="subtle"
            onClick={() => signOut()}
            leftSection={<IconLogout size="1.25rem" />}
          >
            Logout
          </Button>
        </Stack>
      </Stack>
    </AppShellNavbar>
  );
}
