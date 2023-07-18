"use client";

import {
  Navbar,
  UnstyledButton,
  getStylesRef,
  createStyles,
  Select,
  Button,
  Text,
  Divider,
  Stack,
  Box,
} from "@mantine/core";
import {
  IconExternalLink,
  IconFingerprint,
  IconLogout,
  IconPlus,
} from "@tabler/icons-react";
import { signOut } from "next-auth/react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useDidUpdate, useDisclosure } from "@mantine/hooks";
import Image from "next/image";
import Link from "next/link";
import { Commissioner, type Election } from "@eboto-mo/db/schema";
import CreateElection from "@/components/client/modals/create-election";
import { electionDashboardNavbar } from "@/constants";
import { useQuery } from "@tanstack/react-query";
import { getAllMyElections } from "@/utils/election";

const useStyles = createStyles((theme) => ({
  navbar: {
    backgroundColor:
      theme.colorScheme === "dark" ? theme.colors.dark[7] : theme.white,
  },

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  link: {
    ...theme.fn.focusStyles(),
    width: "100%",
    display: "flex",
    alignItems: "center",
    textDecoration: "none",
    fontSize: theme.fontSizes.sm,
    color:
      theme.colorScheme === "dark"
        ? theme.colors.dark[1]
        : theme.colors.gray[7],
    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
    borderRadius: theme.radius.sm,
    fontWeight: 500,

    "&:hover": {
      backgroundColor:
        theme.colorScheme === "dark"
          ? theme.colors.dark[6]
          : theme.colors.gray[0],
      color: theme.colorScheme === "dark" ? theme.white : theme.black,

      [`& .${getStylesRef("icon")}`]: {
        color: theme.colorScheme === "dark" ? theme.white : theme.black,
      },
    },
  },

  linkIcon: {
    ref: getStylesRef("icon"),
    width: "1.25rem",
    color:
      theme.colorScheme === "dark"
        ? theme.colors.dark[2]
        : theme.colors.gray[6],
    marginRight: theme.spacing.sm,
  },

  linkActive: {
    "&, &:hover": {
      backgroundColor: theme.fn.variant({
        variant: "light",
        color: theme.primaryColor,
      }).background,
      color: theme.fn.variant({ variant: "light", color: theme.primaryColor })
        .color,
      [`& .${getStylesRef("icon")}`]: {
        color: theme.fn.variant({ variant: "light", color: theme.primaryColor })
          .color,
      },
    },
  },
}));

export default function NavbarComponent() {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();

  const {
    data: elections,
    isLoading,
    error,
  } = useQuery<(Commissioner & { election: Election })[]>({
    queryKey: ["getAllMyElections"],
    queryFn: async () => await getAllMyElections(),
  });
  const currentElection = elections?.find(
    (election) => election.election.slug === params.slug.toString()
  ).election;

  const { classes, cx } = useStyles();

  return (
    <Navbar
      width={{ sm: 240, md: 300, xl: 340 }}
      //   hidden={!opened}
      hiddenBreakpoint="sm"
      className={classes.navbar}
      sx={{
        overflow: "auto",
      }}
    >
      <Navbar.Section p="md">
        <CreateElection sx={{ width: "100%" }} />
      </Navbar.Section>
      <Divider />

      <Navbar.Section grow p="md">
        <Stack>
          <Select
            defaultValue={params.slug.toString()}
            placeholder={isLoading ? "Loading..." : "Select election"}
            iconWidth={48}
            disabled={isLoading}
            error={(error as Error)?.message}
            icon={
              currentElection && currentElection.logo ? (
                <Image
                  src={currentElection.logo}
                  alt={currentElection.name}
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
                        a.election.updated_at.getTime()
                    )
                    .filter(
                      ({ election }) =>
                        election.start_date < new Date() &&
                        election.end_date > new Date()
                    )
                    .concat(
                      elections.filter(
                        ({ election }) =>
                          !(
                            election.start_date < new Date() &&
                            election.end_date > new Date()
                          )
                      )
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
                      selected: election.slug === params.slug.toString(),
                    }))
                : []
            }
            itemComponent={(
              props: React.ComponentPropsWithoutRef<"button">
            ) => {
              const { election } = elections.find(
                ({ election }) => election.slug === props.value
              );
              if (!election) return null;
              return (
                <UnstyledButton
                  {...props}
                  h={48}
                  sx={(theme) => ({
                    display: "flex",
                    alignItems: "center",
                    gap: theme.spacing.xs,
                  })}
                >
                  {election.logo ? (
                    <Image
                      src={election.logo}
                      alt={election.name}
                      width={20}
                      height={20}
                      priority
                    />
                  ) : (
                    <IconFingerprint size={20} />
                  )}
                  <Text truncate size="sm">
                    {election.name}
                  </Text>
                </UnstyledButton>
              );
            }}
            value={params.slug.toString()}
            onChange={(value) => {
              router.push(`/dashboard/${value || ""}`);
              // setOpened(false);}
            }}
          />
          <Button
            variant="outline"
            w="100%"
            rightIcon={<IconExternalLink size="1rem" />}
            component={Link}
            href={`/${params.slug.toString()}`}
            target="_blank"
          >
            Visit election
          </Button>
          <Box>
            {electionDashboardNavbar.map((item) => (
              <UnstyledButton
                key={item.id}
                component={Link}
                href={`/dashboard/${params.slug.toString()}/${item.path || ""}`}
                // onClick={() => {
                //   opened && setOpened(false);
                // }}
                className={cx(classes.link, {
                  [classes.linkActive]: item.path === pathname.split("/")[3],
                })}
              >
                <item.icon className={classes.linkIcon} />
                {item.label}
              </UnstyledButton>
            ))}
          </Box>
        </Stack>
      </Navbar.Section>
      <Divider />
      <Navbar.Section p="md">
        <UnstyledButton
          className={classes.link}
          onClick={() =>
            void (async () => await signOut({ callbackUrl: "/signin" }))()
          }
        >
          <IconLogout className={classes.linkIcon} />
          <span>Logout</span>
        </UnstyledButton>
      </Navbar.Section>
    </Navbar>
  );
}
