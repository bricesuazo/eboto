import classes from "@/styles/NotFound.module.css";
import { auth } from "@clerk/nextjs";
import { Button, Container, Group, Text, Title } from "@mantine/core";
import type { Metadata } from "next";
import Link from "next/link";
import Balancer from "react-wrap-balancer";

export const metadata: Metadata = {
  title: "404 – Page Not Found",
};
export default function NotFound() {
  const { userId } = auth();

  return (
    <Container className={classes.root} size="md">
      <div className={classes.label}>404</div>
      <Title className={classes.title}>
        <Balancer>You have found a secret place.</Balancer>
      </Title>
      <Text
        color="dimmed"
        size="lg"
        ta="center"
        className={classes.description}
      >
        <Balancer>
          Unfortunately, this is only a 404 page. You may have mistyped the
          address, or the page has been moved to another URL.
        </Balancer>
      </Text>
      <Group justify="center">
        <Button
          variant="subtle"
          size="md"
          component={Link}
          href={userId ? "/dashboard" : "/"}
        >
          Take me back to home page
        </Button>
      </Group>
    </Container>
  );
}
