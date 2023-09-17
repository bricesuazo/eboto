"use client";

import Footer from "@/components/client/components/footer";
import Header from "@/components/client/components/header";
import CreateElection from "@/components/client/modals/create-election";
import { useStore } from "@/store";
import { api } from "@/trpc/client";
import { useClerk } from "@clerk/nextjs";
import { electionDashboardNavbar } from "@eboto-mo/constants";
import {
  AppShell,
  AppShellFooter,
  AppShellHeader,
  AppShellMain,
  AppShellNavbar,
  Button,
  CheckIcon,
  Combobox,
  ComboboxChevron,
  ComboboxDropdown,
  ComboboxGroup,
  ComboboxOption,
  ComboboxOptions,
  ComboboxTarget,
  Divider,
  Group,
  InputBase,
  InputPlaceholder,
  Stack,
  Text,
  useCombobox,
} from "@mantine/core";
import { IconExternalLink, IconLogout } from "@tabler/icons-react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";

export default function DashboardElection({
  children,
  userId,
}: React.PropsWithChildren<{
  userId: string | null;
}>) {
  const { signOut } = useClerk();
  const router = useRouter();
  const params = useParams();

  const pathname = usePathname();

  const { data: elections } = api.election.getAllMyElections.useQuery();

  const currentElectionUser = elections
    ? elections.find(
        ({ election }) =>
          election.slug === params?.electionDashboardSlug?.toString(),
      )
    : null;

  const currentElection = currentElectionUser?.election;

  const combobox = useCombobox({
    onDropdownOpen: (eventSource) => {
      store.toggleDashboardMenu(true);
      if (eventSource === "keyboard") {
        combobox.selectActiveOption();
      } else {
        combobox.updateSelectedOptionIndex("active");
      }
    },
  });
  const store = useStore();

  return (
    <AppShell
      header={{ height: 60 }}
      footer={{ height: 52 }}
      navbar={{
        breakpoint: "xs",
        width: { base: 200, sm: 300 },
        collapsed: {
          desktop: false,
          mobile: !store.dashboardMenu,
        },
      }}
      p="md"
    >
      <AppShellHeader>
        <Header
          userId={userId}
          elections={elections?.map(({ election }) => election)}
        />
      </AppShellHeader>

      <AppShellMain>{children}</AppShellMain>

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
              <Combobox
                store={combobox}
                resetSelectionOnOptionHover
                onOptionSubmit={(val) => {
                  combobox.toggleDropdown();
                  if (!val) return;

                  if (currentElection?.slug === val) return;

                  router.push(`/dashboard/${val}`);
                  combobox.updateSelectedOptionIndex("active");
                }}
              >
                <ComboboxTarget targetType="button">
                  <InputBase
                    component="button"
                    pointer
                    rightSection={<ComboboxChevron />}
                    onClick={() => combobox.toggleDropdown()}
                  >
                    {currentElection?.name ? (
                      <Text truncate size="sm">
                        {currentElection?.name}
                      </Text>
                    ) : (
                      <InputPlaceholder>
                        <Text truncate size="sm">
                          Select an election
                        </Text>
                      </InputPlaceholder>
                    )}
                  </InputBase>
                </ComboboxTarget>

                <ComboboxDropdown>
                  <ComboboxOptions>
                    {elections &&
                      [
                        {
                          group: "Ongoing",
                          elections: elections
                            .filter(
                              ({ election }) =>
                                election.start_date < new Date() &&
                                election.end_date > new Date(),
                            )
                            .sort(
                              (a, b) =>
                                b.election.updated_at.getTime() -
                                a.election.updated_at.getTime(),
                            ),
                        },
                        {
                          group: "Upcoming",
                          elections: elections
                            .filter(
                              ({ election }) =>
                                election.start_date > new Date(),
                            )
                            .sort(
                              (a, b) =>
                                b.election.updated_at.getTime() -
                                a.election.updated_at.getTime(),
                            ),
                        },
                        {
                          group: "Completed",
                          elections: elections
                            .filter(
                              ({ election }) => election.end_date < new Date(),
                            )
                            .sort(
                              (a, b) =>
                                b.election.updated_at.getTime() -
                                a.election.updated_at.getTime(),
                            ),
                        },
                      ].map(({ group, elections }) => (
                        <ComboboxGroup key={group} label={group}>
                          {elections.map(({ election }) => (
                            <ComboboxOption
                              key={election.id}
                              value={election.slug}
                              active={currentElection?.slug === election.slug}
                              selected={currentElection?.slug === election.slug}
                            >
                              <Group gap="xs">
                                {currentElection?.slug === election.slug && (
                                  <CheckIcon size={12} />
                                )}
                                <span>{election.name}</span>
                              </Group>
                            </ComboboxOption>
                          ))}
                        </ComboboxGroup>
                      ))}
                  </ComboboxOptions>
                </ComboboxDropdown>
              </Combobox>

              <Button
                variant="outline"
                w="100%"
                rightSection={<IconExternalLink size="1rem" />}
                component={Link}
                href={`/${params?.electionDashboardSlug?.toString()}`}
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
                    href={`/dashboard/${params?.electionDashboardSlug?.toString()}/${
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

          <Stack hiddenFrom="xs">
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

      <AppShellFooter>
        <Footer />
      </AppShellFooter>
    </AppShell>
  );
}
