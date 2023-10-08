"use client";

import Link from "next/link";
import classes from "@/styles/NotFound.module.css";
import { Button, Container, Group, Text, Title } from "@mantine/core";
import Balancer from "react-wrap-balancer";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Container className={classes.root} size="md">
      <div className={classes.label}>{error.name}</div>
      <Title className={classes.title}>
        <Balancer>{error.message}</Balancer>
      </Title>
      <Text c="dimmed" size="lg" ta="center" className={classes.description}>
        <Balancer>
          Something went wrong, we are working on it and will fix it as soon as
          possible.
        </Balancer>
      </Text>
      <Group justify="center">
        <Button variant="subtle" size="md" component={Link} href="/">
          Take me back to home page
        </Button>
        <Button variant="subtle" size="md" onClick={reset}>
          Reset
        </Button>
      </Group>
    </Container>
  );
}
