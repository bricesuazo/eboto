import Image from "next/image";
import Link from "next/link";
import {
  Accordion,
  AccordionControl,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Center,
  Container,
  Flex,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconArrowRight } from "@tabler/icons-react";
import Balancer from "react-wrap-balancer";

import { FAQs } from "@eboto/constants";

import ContactForm from "~/components/contact-form";
import ElectionBoost from "~/components/modals/election-boost";
import ReactPlayer from "react-player";
import classes from "~/styles/Home.module.css";
import { MainPricing } from "./pricing/page";

export default function HomePage() {
  return (
    <>
      <ElectionBoost />
      <Container size="md" pos="relative" pb={80}>
        <Dots className={classes.dots} style={{ left: 0, top: 0 }} />
        <Dots className={classes.dots} style={{ left: 60, top: 0 }} />
        <Dots className={classes.dots} style={{ left: 0, top: 140 }} />
        <Dots className={classes.dots} style={{ right: 0, top: 60 }} />

        <Stack gap={80}>
          <Box pos="relative" py={156}>
            <Title
              ta={{ base: "left", sm: "center" }}
              fz={{ base: "2.25rem", sm: "3rem" }}
              mb="md"
              lts={-1}
              className={classes.title}
            >
              <Balancer>
                Your{" "}
                <Text component="span" className={classes.highlight} inherit>
                  One-Stop
                </Text>{" "}
                Online Voting Solution
              </Balancer>
            </Title>

            <Container p={0} size="md">
              <Text
                fz={{ base: "md", sm: "lg", md: "xl" }}
                ta={{ base: "left", sm: "center" }}
              >
                <Balancer>
                  Empower your elections with eBoto, the versatile and web-based
                  voting platform that offers secure online elections for any
                  type of organization.
                </Balancer>
              </Text>
            </Container>

            <Flex
              justify="center"
              mt="lg"
              gap="sm"
              direction={{ base: "column", sm: "row" }}
            >
              <Button
                component={Link}
                href="/sign-in"
                className={classes.control}
                size="md"
                variant="outline"
              >
                Sign in
              </Button>
              <Button
                component={Link}
                href="/register"
                className={classes.control}
                size="md"
              >
                Get started
              </Button>
            </Flex>
          </Box>

          <Stack gap="xl" id="what">
            <Title order={2} ta="center">
              <Balancer>Ano ang eBoto? (What is eBoto?)</Balancer>
            </Title>

            <Box className={classes.playerContainer}>
              <ReactPlayer
                src="https://www.youtube.com/watch?v=BKud553RTbk"
                width="100%"
                height="100%"
                controls
              />
            </Box>
          </Stack>

          {/* <Box id="public-elections">
            <PublicElections />
          </Box> */}
          <Flex direction="column" gap="md">
            <MainPricing />
          </Flex>

          <Center>
            <Button
              variant="default"
              component={Link}
              href="/pricing"
              size="lg"
              radius="xl"
              rightSection={<IconArrowRight />}
            >
              View all pricing
            </Button>
          </Center>

          <SimpleGrid id="faq" cols={{ base: 1, sm: 2 }} pos="relative">
            <Box
              top={60}
              style={{
                aspectRatio: "3/2",
              }}
              pos={{ base: "inherit", sm: "sticky" }}
            >
              <Image
                src="/images/faq.svg"
                fill
                alt="Frequently Asked Questions"
                style={{
                  userSelect: "none",
                  pointerEvents: "none",
                  zIndex: -1,
                }}
              />
            </Box>

            <Box>
              <Title order={2} ta="left" p="md" visibleFrom="sm">
                Frequently Asked Questions
              </Title>
              <Title order={2} ta="center" p="md" hiddenFrom="sm">
                Frequently Asked Questions
              </Title>

              <Accordion
                chevronPosition="right"
                defaultValue={FAQs[0]?.id ?? ""}
                variant="separated"
              >
                {FAQs.map((item) => (
                  <AccordionItem key={item.id} value={item.id}>
                    <AccordionControl>{item.question}</AccordionControl>
                    <AccordionPanel>{item.answer}</AccordionPanel>
                  </AccordionItem>
                ))}
              </Accordion>
            </Box>
          </SimpleGrid>

          <Box id="contact">
            <ContactForm />
          </Box>

          <Stack gap="xs" className={classes.cta}>
            <Title ta="center">
              <Balancer>Ready to get started?</Balancer>
            </Title>
            <Text ta="center" fz="lg">
              <Balancer>
                Create your free account today and start voting online in
                minutes.
              </Balancer>
            </Text>
          </Stack>
        </Stack>
      </Container>
    </>
  );
}

interface DotsProps extends React.ComponentPropsWithoutRef<"svg"> {
  size?: number;
  radius?: number;
}

function Dots({ size = 185, radius = 2.5, ...others }: DotsProps) {
  return (
    <svg
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      viewBox="0 0 185 185"
      width={size}
      height={size}
      {...others}
    >
      <rect width="5" height="5" rx={radius} />
      <rect width="5" height="5" x="60" rx={radius} />
      <rect width="5" height="5" x="120" rx={radius} />
      <rect width="5" height="5" x="20" rx={radius} />
      <rect width="5" height="5" x="80" rx={radius} />
      <rect width="5" height="5" x="140" rx={radius} />
      <rect width="5" height="5" x="40" rx={radius} />
      <rect width="5" height="5" x="100" rx={radius} />
      <rect width="5" height="5" x="160" rx={radius} />
      <rect width="5" height="5" x="180" rx={radius} />
      <rect width="5" height="5" y="20" rx={radius} />
      <rect width="5" height="5" x="60" y="20" rx={radius} />
      <rect width="5" height="5" x="120" y="20" rx={radius} />
      <rect width="5" height="5" x="20" y="20" rx={radius} />
      <rect width="5" height="5" x="80" y="20" rx={radius} />
      <rect width="5" height="5" x="140" y="20" rx={radius} />
      <rect width="5" height="5" x="40" y="20" rx={radius} />
      <rect width="5" height="5" x="100" y="20" rx={radius} />
      <rect width="5" height="5" x="160" y="20" rx={radius} />
      <rect width="5" height="5" x="180" y="20" rx={radius} />
      <rect width="5" height="5" y="40" rx={radius} />
      <rect width="5" height="5" x="60" y="40" rx={radius} />
      <rect width="5" height="5" x="120" y="40" rx={radius} />
      <rect width="5" height="5" x="20" y="40" rx={radius} />
      <rect width="5" height="5" x="80" y="40" rx={radius} />
      <rect width="5" height="5" x="140" y="40" rx={radius} />
      <rect width="5" height="5" x="40" y="40" rx={radius} />
      <rect width="5" height="5" x="100" y="40" rx={radius} />
      <rect width="5" height="5" x="160" y="40" rx={radius} />
      <rect width="5" height="5" x="180" y="40" rx={radius} />
      <rect width="5" height="5" y="60" rx={radius} />
      <rect width="5" height="5" x="60" y="60" rx={radius} />
      <rect width="5" height="5" x="120" y="60" rx={radius} />
      <rect width="5" height="5" x="20" y="60" rx={radius} />
      <rect width="5" height="5" x="80" y="60" rx={radius} />
      <rect width="5" height="5" x="140" y="60" rx={radius} />
      <rect width="5" height="5" x="40" y="60" rx={radius} />
      <rect width="5" height="5" x="100" y="60" rx={radius} />
      <rect width="5" height="5" x="160" y="60" rx={radius} />
      <rect width="5" height="5" x="180" y="60" rx={radius} />
      <rect width="5" height="5" y="80" rx={radius} />
      <rect width="5" height="5" x="60" y="80" rx={radius} />
      <rect width="5" height="5" x="120" y="80" rx={radius} />
      <rect width="5" height="5" x="20" y="80" rx={radius} />
      <rect width="5" height="5" x="80" y="80" rx={radius} />
      <rect width="5" height="5" x="140" y="80" rx={radius} />
      <rect width="5" height="5" x="40" y="80" rx={radius} />
      <rect width="5" height="5" x="100" y="80" rx={radius} />
      <rect width="5" height="5" x="160" y="80" rx={radius} />
      <rect width="5" height="5" x="180" y="80" rx={radius} />
      <rect width="5" height="5" y="100" rx={radius} />
      <rect width="5" height="5" x="60" y="100" rx={radius} />
      <rect width="5" height="5" x="120" y="100" rx={radius} />
      <rect width="5" height="5" x="20" y="100" rx={radius} />
      <rect width="5" height="5" x="80" y="100" rx={radius} />
      <rect width="5" height="5" x="140" y="100" rx={radius} />
      <rect width="5" height="5" x="40" y="100" rx={radius} />
      <rect width="5" height="5" x="100" y="100" rx={radius} />
      <rect width="5" height="5" x="160" y="100" rx={radius} />
      <rect width="5" height="5" x="180" y="100" rx={radius} />
      <rect width="5" height="5" y="120" rx={radius} />
      <rect width="5" height="5" x="60" y="120" rx={radius} />
      <rect width="5" height="5" x="120" y="120" rx={radius} />
      <rect width="5" height="5" x="20" y="120" rx={radius} />
      <rect width="5" height="5" x="80" y="120" rx={radius} />
      <rect width="5" height="5" x="140" y="120" rx={radius} />
      <rect width="5" height="5" x="40" y="120" rx={radius} />
      <rect width="5" height="5" x="100" y="120" rx={radius} />
      <rect width="5" height="5" x="160" y="120" rx={radius} />
      <rect width="5" height="5" x="180" y="120" rx={radius} />
      <rect width="5" height="5" y="140" rx={radius} />
      <rect width="5" height="5" x="60" y="140" rx={radius} />
      <rect width="5" height="5" x="120" y="140" rx={radius} />
      <rect width="5" height="5" x="20" y="140" rx={radius} />
      <rect width="5" height="5" x="80" y="140" rx={radius} />
      <rect width="5" height="5" x="140" y="140" rx={radius} />
      <rect width="5" height="5" x="40" y="140" rx={radius} />
      <rect width="5" height="5" x="100" y="140" rx={radius} />
      <rect width="5" height="5" x="160" y="140" rx={radius} />
      <rect width="5" height="5" x="180" y="140" rx={radius} />
      <rect width="5" height="5" y="160" rx={radius} />
      <rect width="5" height="5" x="60" y="160" rx={radius} />
      <rect width="5" height="5" x="120" y="160" rx={radius} />
      <rect width="5" height="5" x="20" y="160" rx={radius} />
      <rect width="5" height="5" x="80" y="160" rx={radius} />
      <rect width="5" height="5" x="140" y="160" rx={radius} />
      <rect width="5" height="5" x="40" y="160" rx={radius} />
      <rect width="5" height="5" x="100" y="160" rx={radius} />
      <rect width="5" height="5" x="160" y="160" rx={radius} />
      <rect width="5" height="5" x="180" y="160" rx={radius} />
      <rect width="5" height="5" y="180" rx={radius} />
      <rect width="5" height="5" x="60" y="180" rx={radius} />
      <rect width="5" height="5" x="120" y="180" rx={radius} />
      <rect width="5" height="5" x="20" y="180" rx={radius} />
      <rect width="5" height="5" x="80" y="180" rx={radius} />
      <rect width="5" height="5" x="140" y="180" rx={radius} />
      <rect width="5" height="5" x="40" y="180" rx={radius} />
      <rect width="5" height="5" x="100" y="180" rx={radius} />
      <rect width="5" height="5" x="160" y="180" rx={radius} />
      <rect width="5" height="5" x="180" y="180" rx={radius} />
    </svg>
  );
}
