"use client";

import CreatePartylist from "@/components/client/modals/create-partylist";
import DeletePartylist from "@/components/client/modals/delete-partylist";
import EditPartylist from "@/components/client/modals/edit-partylist";
import classes from "@/styles/Partylist.module.css";
import { api } from "@/trpc/client";
import { Box, Flex, Group, Stack, Text, Title } from "@mantine/core";
import { IconFlag } from "@tabler/icons-react";

import type { Election, Partylist } from "@eboto-mo/db/schema";

export default function DashboardPartylist({
  election,
  partylists,
}: {
  election: Election;
  partylists: Partylist[];
}) {
  const partylistsQuery =
    api.election.getAllPartylistsWithoutINDByElectionId.useQuery(
      {
        election_id: election.id,
      },
      { initialData: partylists },
    );

  return (
    <Stack>
      <CreatePartylist election_id={election.id} />

      <Group gap="xs">
        {!partylistsQuery.data.length ? (
          <Text>No partylists yet.</Text>
        ) : (
          partylistsQuery.data.map((partylist) => (
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
