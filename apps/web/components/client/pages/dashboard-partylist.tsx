"use client";

import { Group, Stack, Text } from "@mantine/core";
import { Election, type Partylist } from "@eboto-mo/db/schema";
import PartylistCard from "../components/partylist-card";
import CreatePartylist from "../modals/create-partylist";

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

      <Group spacing="xs">
        {!partylists.length ? (
          <Text>No partylists yet.</Text>
        ) : (
          partylists.map((partylist) => (
            <PartylistCard key={partylist.id} partylist={partylist} />
          ))
        )}
      </Group>
    </Stack>
  );
}
