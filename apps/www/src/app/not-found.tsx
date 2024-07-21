import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button, Center, Container, Group, Text, Title } from "@mantine/core";
import Balancer from "react-wrap-balancer";

import classes from "~/styles/NotFound.module.css";

export const metadata: Metadata = {
  title: "404 – Page Not Found",
};
export default function NotFound() {
  return (
    <Container className={classes.root} size="md">
      <Center mb="xl" style={{ flexDirection: "column" }}>
        <Image src="/images/logo.png" alt="Logo" width={60} height={60} />
        <Title>eBoto</Title>
      </Center>
      <div className={classes.label}>404</div>
      <Title className={classes.title}>
        <Balancer>You have found a secret place.</Balancer>
      </Title>
      <Text c="dimmed" size="lg" ta="center" className={classes.description}>
        <Balancer>
          Unfortunately, this is only a 404 page. You may have mistyped the
          address, or the page has been moved to another URL.
        </Balancer>
      </Text>
      <Group justify="center">
        <Button variant="subtle" size="md" component={Link} href="/">
          Take me back to home page
        </Button>
      </Group>
    </Container>
  );
}
