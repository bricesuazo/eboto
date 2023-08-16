"use client";

import CreatePartylist from "@/components/client/modals/create-partylist";
import DeletePartylist from "@/components/client/modals/delete-partylist";
import EditPartylist from "@/components/client/modals/edit-partylist";
import classes from "@/styles/Partylist.module.css";
import type { Election, Partylist } from "@eboto-mo/db/schema";
import { Box, Flex, Group, Stack, Text, Title } from "@mantine/core";
import { IconFlag } from "@tabler/icons-react";

export default function DashboardPartylist({
  election,
  partylists,
}: {
  election: Election;
  partylists: Partylist[];
}) {
  return (
    <Stack>
      <CreatePartylist election_id={election.id} />

      <Group gap="xs">
        {!partylists.length ? (
          <Text>No partylists yet.</Text>
        ) : (
          partylists.map((partylist) => (
            <Flex key={partylist.id} className={classes["partylist-card"]}>
              <Flex direction="column" align="center">
                <Box>
                  <IconFlag size={40} />
                </Box>
                <Title order={4} style={{ lineClamp: 2 }} ta="center">
                  {partylist.name} ({partylist.acronym})
                </Title>
              </Flex>

              <Flex gap="xs" justify="center">
                <EditPartylist partylist={partylist} />
                <DeletePartylist partylist={partylist} />
              </Flex>
            </Flex>
          ))
        )}
      </Group>
    </Stack>
  );
}
