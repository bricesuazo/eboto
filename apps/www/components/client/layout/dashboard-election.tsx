"use client";

import CreateElection from "@/components/client/modals/create-election";
import { electionDashboardNavbar } from "@/constants";
import { useStore } from "@/store";
import { useClerk } from "@clerk/nextjs";
import type { User } from "@clerk/nextjs/api";
import type { Election } from "@eboto-mo/db/schema";
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

import Footer from "../components/footer";
import HeaderContent from "../components/header";

export default function DashboardElection({
  children,
  user,
  elections,
}: React.PropsWithChildren<{
  user: User | null;
  elections: Election[];
}>) {
  const { signOut } = useClerk();
  const router = useRouter();
  const params = useParams();

  const pathname = usePathname();

  const currentElection = elections
    ? elections.find(
        (election) =>
          election.slug === params.electionDashboardSlug?.toString(),
      )
    : null;
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
        <HeaderContent user={user} elections={elections} />
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
                      <InputPlaceholder>Pick value</InputPlaceholder>
                    )}
                  </InputBase>
                </ComboboxTarget>

                <ComboboxDropdown>
                  <ComboboxOptions>
                    {[
                      {
                        group: "Ongoing",
                        elections: elections
                          .filter(
                            (election) =>
                              election.start_date < new Date() &&
                              election.end_date > new Date(),
                          )
                          .sort(
                            (a, b) =>
                              b.updated_at.getTime() - a.updated_at.getTime(),
                          ),
                      },
                      {
                        group: "Upcoming",
                        elections: elections
                          .filter(
                            (election) => election.start_date > new Date(),
                          )
                          .sort(
                            (a, b) =>
                              b.updated_at.getTime() - a.updated_at.getTime(),
                          ),
                      },
                      {
                        group: "Completed",
                        elections: elections
                          .filter((election) => election.end_date < new Date())
                          .sort(
                            (a, b) =>
                              b.updated_at.getTime() - a.updated_at.getTime(),
                          ),
                      },
                    ].map(({ group, elections }) => (
                      <ComboboxGroup key={group} label={group}>
                        {elections.map((election) => (
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
