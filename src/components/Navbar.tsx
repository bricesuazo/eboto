import {
  Navbar,
  UnstyledButton,
  getStylesRef,
  createStyles,
  rem,
  Select,
} from "@mantine/core";
import { IconFingerprint, IconLogout } from "@tabler/icons-react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/router";
import { electionDashboardNavbar } from "../constants";
import type { Dispatch, SetStateAction } from "react";
import { api } from "../utils/api";

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

  const elections = api.election.getMyElections.useQuery(undefined, {
    enabled: router.isReady,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const { classes, cx } = useStyles();

  return (
    <Navbar
      width={{ sm: 200, lg: 300 }}
      hidden={!opened}
      hiddenBreakpoint="sm"
      p="md"
      className={classes.navbar}
    >
      <Navbar.Section mb="md">
        <Select
          defaultValue={router.query.electionSlug as string}
          placeholder="Select election"
          icon={<IconFingerprint />}
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
          itemComponent={(props: React.ComponentPropsWithoutRef<"button">) => (
            <UnstyledButton {...props} h={48}>
              {props.value}
            </UnstyledButton>
          )}
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
  );
};

export default NavbarComponent;
