"use client";

import CreateElection from "@/components/client/modals/create-election";
import { useStore } from "@/store";
import classes from "@/styles/DashboardNavbar.module.css";
import { api } from "@/trpc/client";
import { useClerk } from "@clerk/nextjs";
import { electionDashboardNavbar } from "@eboto-mo/api/src/constants";
import { Commissioner, Election } from "@eboto-mo/db/schema";
import {
  AppShell,
  Box,
  Button,
  Divider,
  Select,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core";
import {
  IconExternalLink,
  IconFingerprint,
  IconLogout,
} from "@tabler/icons-react";
import cx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";

export default function NavbarComponent() {
  const { signOut } = useClerk();
  const router = useRouter();
  const params = useParams();
  if (
    !params ||
    !params.electionDashboardSlug ||
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
    <AppShell.Navbar
      hidden={
        !store.dashboardMenu || params.electionDashboardSlug === undefined
      }
      className={classes.navbar}
      style={{
        overflow: "auto",
      }}
    >
      {/* <Navbar.Section p="md"> */}
      <CreateElection style={{ width: "100%" }} />
      {/* </Navbar.Section> */}
      <Divider />

      {/* <Navbar.Section grow p="md"> */}
      <Stack>
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
                      election.slug === params.electionDashboardSlug.toString(),
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
          value={params.electionDashboardSlug.toString()}
          onChange={(value) => {
            router.push(`/dashboard/${value || ""}`);
            store.toggleDashboardMenu(false);
          }}
        />
        <Button
          variant="outline"
          w="100%"
          rightSection={<IconExternalLink size="1rem" />}
          component={Link}
          href={`/${params.electionDashboardSlug.toString()}`}
          target="_blank"
        >
          Visit election
        </Button>
        <Box>
          {electionDashboardNavbar.map((item) => (
            <UnstyledButton
              key={item.id}
              component={Link}
              href={`/dashboard/${params.electionDashboardSlug.toString()}/${
                item.path || ""
              }`}
              onClick={() => {
                store.dashboardMenu && store.toggleDashboardMenu(false);
              }}
              className={cx(classes.link, {
                [classes.linkActive]: item.path === pathname?.split("/")[3],
              })}
            >
              <item.icon className={classes.linkIcon} />
              {item.label}
            </UnstyledButton>
          ))}
        </Box>
      </Stack>
      {/* </Navbar.Section> */}
      <Divider />
      {/* <Navbar.Section p="md"> */}
      <UnstyledButton className={classes.link} onClick={() => signOut()}>
        <IconLogout className={classes.linkIcon} />
        <span>Logout</span>
      </UnstyledButton>
      {/* </Navbar.Section> */}
    </AppShell.Navbar>
  );
}
