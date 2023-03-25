import {
  Navbar,
  UnstyledButton,
  getStylesRef,
  createStyles,
  Select,
  Button,
  Text,
  Divider,
} from "@mantine/core";
import {
  IconExternalLink,
  IconFingerprint,
  IconLogout,
  IconPlus,
} from "@tabler/icons-react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/router";
import { electionDashboardNavbar } from "../constants";
import type { Dispatch, SetStateAction } from "react";
import { api } from "../utils/api";
import CreateElectionModal from "./modals/CreateElection";
import { useDidUpdate, useDisclosure } from "@mantine/hooks";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Election } from "@prisma/client";

const useStyles = createStyles((theme) => ({
  navbar: {
    backgroundColor:
      theme.colorScheme === "dark" ? theme.colors.dark[7] : theme.white,
  },
  divider: {
    backgroundColor:
      theme.colorScheme === "dark"
        ? theme.colors.gray[1]
        : theme.colors.gray[0],

    margin: `${theme.spacing.lg} 0`,
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

const NavbarComponent = ({
  opened,
  setOpened,
}: {
  opened: boolean;
  setOpened: Dispatch<SetStateAction<boolean>>;
}) => {
  const router = useRouter();
  const [isOpen, { open, close }] = useDisclosure(false);
  const [election, setElection] = useState<Election | undefined>();

  const elections = api.election.getMyElections.useQuery(undefined, {
    enabled: router.isReady,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: "always",
  });

  useDidUpdate(() => {
    void (async () => {
      await elections.refetch();
    })();
  }, [router.query.electionSlug]);

  useDidUpdate(() => {
    setElection(
      elections.data?.find(
        (election) => election.slug === router.query.electionSlug
      )
    );
  }, [elections.data]);

  const { classes, cx } = useStyles();

  return (
    <>
      <CreateElectionModal isOpen={isOpen} onClose={close} />
      <Navbar
        width={{ sm: 200, lg: 300 }}
        hidden={!opened}
        hiddenBreakpoint="sm"
        p="md"
        className={classes.navbar}
        sx={{
          overflow: "auto",
        }}
      >
        <Navbar.Section>
          <Button
            onClick={open}
            w="100%"
            leftIcon={<IconPlus size="1.25rem" />}
          >
            Create election
          </Button>
        </Navbar.Section>
        <Divider className={classes.divider} />

        <Navbar.Section mb="md">
          <Select
            defaultValue={
              election?.slug || (router.query.electionSlug as string)
            }
            placeholder="Select election"
            iconWidth={48}
            icon={
              election?.logo ? (
                <Image
                  src={election.logo}
                  alt={election.name}
                  width={28}
                  height={28}
                />
              ) : (
                <IconFingerprint size={28} />
              )
            }
            size="md"
            data={
              elections.data
                ? elections.data
                    .sort(
                      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
                    )
                    .filter(
                      (election) =>
                        election.start_date < new Date() &&
                        election.end_date > new Date()
                    )
                    .concat(
                      elections.data.filter(
                        (election) =>
                          !(
                            election.start_date < new Date() &&
                            election.end_date > new Date()
                          )
                      )
                    )
                    .map((selectedElection) => ({
                      label: selectedElection.name,
                      value: selectedElection.slug,
                      group:
                        selectedElection.start_date > new Date()
                          ? "Upcoming"
                          : selectedElection.end_date < new Date()
                          ? "Completed"
                          : "Ongoing",
                      selected:
                        selectedElection.slug === election?.slug ||
                        selectedElection.slug ===
                          (router.query.electionSlug as string),
                    }))
                : []
            }
            itemComponent={(
              props: React.ComponentPropsWithoutRef<"button">
            ) => {
              const election = elections.data?.find(
                (election) => election.slug === props.value
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
            value={election?.slug || (router.query.electionSlug as string)}
            onChange={(value) =>
              void (async () => {
                await router.push(`/dashboard/${value || ""}`);
                setOpened(false);
              })()
            }
          />
        </Navbar.Section>
        <Navbar.Section mb="md">
          <Button
            variant="outline"
            w="100%"
            loading={!election}
            rightIcon={<IconExternalLink size="1rem" />}
            component={Link}
            href={`/${election?.slug || ""}`}
            target="_blank"
          >
            Visit {election?.name || "election"}
          </Button>
        </Navbar.Section>
        <Navbar.Section grow>
          {electionDashboardNavbar.map((item) => (
            <UnstyledButton
              key={item.id}
              component={Link}
              href={`/dashboard/${router.query.electionSlug as string}/${
                item.path || ""
              }`}
              onClick={() => {
                opened && setOpened(false);
              }}
              className={cx(classes.link, {
                [classes.linkActive]:
                  item.path ===
                  router.pathname.split("/dashboard/[electionSlug]/")[1],
              })}
            >
              <item.icon className={classes.linkIcon} />
              {item.label}
            </UnstyledButton>
          ))}
        </Navbar.Section>
        <Divider className={classes.divider} />
        <Navbar.Section>
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
    </>
  );
};

export default NavbarComponent;
