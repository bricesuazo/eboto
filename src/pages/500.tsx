import {
  createStyles,
  Title,
  Text,
  Button,
  Container,
  Group,
  rem,
} from "@mantine/core";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Balancer from "react-wrap-balancer";

const useStyles = createStyles((theme) => ({
  root: {
    paddingTop: rem(80),
    paddingBottom: rem(80),
  },

  label: {
    textAlign: "center",
    fontWeight: 900,
    fontSize: rem(220),
    lineHeight: 1,
    marginBottom: `calc(${theme.spacing.xl} * 1.5)`,
    color:
      theme.colorScheme === "dark"
        ? theme.colors.dark[4]
        : theme.colors.gray[2],

    [theme.fn.smallerThan("sm")]: {
      fontSize: rem(120),
    },
  },

  title: {
    textAlign: "center",
    fontWeight: 900,
    fontSize: rem(38),

    [theme.fn.smallerThan("sm")]: {
      fontSize: rem(32),
    },
  },

  description: {
    margin: "auto",
    marginTop: theme.spacing.xl,
    marginBottom: `calc(${theme.spacing.xl} * 1.5)`,
  },
}));

function Error500() {
  const { classes } = useStyles();
  const session = useSession();

  return (
    <Container className={classes.root}>
      <div className={classes.label}>500</div>
      <Title className={classes.title}>
        <Balancer>Internal server error</Balancer>
      </Title>
      <Text
        color="dimmed"
        size="lg"
        align="center"
        className={classes.description}
      >
        <Balancer>
          Something went wrong, we are working on it and will fix it as soon as
          possible.
        </Balancer>
      </Text>
      <Group position="center">
        <Button
          variant="subtle"
          size="md"
          component={Link}
          href={session.status === "authenticated" ? "/dashboard" : "/"}
        >
          Take me back to home page
        </Button>
      </Group>
    </Container>
  );
}
export default Error500;
