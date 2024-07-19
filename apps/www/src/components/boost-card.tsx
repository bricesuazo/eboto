"use client";

import Link from "next/link";
import {
  Box,
  Button,
  List,
  ListItem,
  rem,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { IconCircleCheck, IconRocket } from "@tabler/icons-react";

import { useStore } from "~/store";
import ElectionBoost from "./modals/election-boost";

export default function BoostCard({ election_id }: { election_id: string }) {
  const store = useStore();
  return (
    <>
      <ElectionBoost />
      <Box
        p="md"
        style={{
          border: "2px solid #2f9e44",
          borderRadius: "0.5rem",
        }}
      >
        <Title order={4}>Boost is available!</Title>

        <List
          spacing={4}
          mt="xs"
          size="sm"
          center
          icon={
            <ThemeIcon variant="gradient" size={24} radius="xl">
              <IconCircleCheck style={{ width: rem(16), height: rem(16) }} />
            </ThemeIcon>
          }
        >
          <ListItem>Ad-Free</ListItem>
          <ListItem>Live Support</ListItem>
          <ListItem>Realtime Chat w/ Voters</ListItem>
          <ListItem>Result Realtime Update</ListItem>
          <Text size="sm" ml={36} mt={4}>
            ...and more!
          </Text>
        </List>

        <Button
          mt="sm"
          radius="xl"
          variant="gradient"
          w="100%"
          rightSection={<IconRocket size="1.5em" />}
          onClick={() => {
            store.toggleElectionBoost(true);
            store.setElectionBoostElectionId(election_id);
          }}
        >
          Get Boost
        </Button>
        <Button
          component={Link}
          href="/pricing"
          mt="xs"
          size="xs"
          radius="xl"
          variant="default"
          w="100%"
        >
          Learn More
        </Button>
      </Box>
    </>
  );
}
