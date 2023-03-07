import {
  Navbar,
  UnstyledButton,
  getStylesRef,
  createStyles,
  rem,
  Select,
  Button,
  Text,
  Flex,
} from "@mantine/core";
import { IconFingerprint, IconLogout, IconPlus } from "@tabler/icons-react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/router";
import { electionDashboardNavbar } from "../constants";
import type { Dispatch, SetStateAction } from "react";
import { api } from "../utils/api";
import CreateElectionModal from "./modals/CreateElection";
import { useDisclosure } from "@mantine/hooks";
import Image from "next/image";

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

  footer: {
    borderTop: `${rem(1)} solid ${
      theme.colorScheme === "dark" ? theme.colors.dark[4] : theme.colors.gray[3]
    }`,
    paddingTop: theme.spacing.md,
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

  const elections = api.election.getMyElections.useQuery(undefined, {
    enabled: router.isReady,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const election = elections.data?.find(
    (election) => election.slug === router.query.electionSlug
  );

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
      >
        <Navbar.Section mb="md">
          <Button
            onClick={open}
            w="100%"
            variant="gradient"
            leftIcon={<IconPlus size="1.25rem" />}
          >
            Create election
          </Button>
        </Navbar.Section>

        <Navbar.Section mb="md">
          <Select
            defaultValue={router.query.electionSlug as string}
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
                    .sort((a, b) => b.end_date.getTime() - a.end_date.getTime())
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
                    .map((election) => ({
                      label: election.name,
                      value: election.slug,
                      group:
                        election.start_date > new Date()
                          ? "Upcoming Elections"
                          : election.end_date < new Date()
                          ? "Past Elections"
                          : "Ongoing Elections",
                      selected: election.slug === router.query.electionSlug,
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
            onChange={(value) =>
              void (async () => {
                await router.push(`/dashboard/${value || ""}`);
                setOpened(false);
              })()
            }
          />
        </Navbar.Section>
        <Navbar.Section grow>
          {electionDashboardNavbar.map((item) => (
            <UnstyledButton
              key={item.id}
              onClick={() => {
                void (async () => {
                  await router.push(
                    `/dashboard/${router.query.electionSlug as string}/${
                      item.path || ""
                    }`
                  );
                  opened && setOpened(false);
                })();
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
        <Navbar.Section className={classes.footer}>
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
