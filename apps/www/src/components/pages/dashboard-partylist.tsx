"use client";

import CreatePartylist from "@/components/modals/create-partylist";
import DeletePartylist from "@/components/modals/delete-partylist";
import EditPartylist from "@/components/modals/edit-partylist";
import classes from "@/styles/Partylist.module.css";
import { api } from "@/trpc/client";
import { Box, Flex, Group, Stack, Text, Title } from "@mantine/core";
import { IconFlag } from "@tabler/icons-react";

import type { RouterOutputs } from "@eboto/api";

import type { Database } from "../../../../../supabase/types";

export default function DashboardPartylist({
  election,
  partylists,
}: {
  election: Database["public"]["Tables"]["elections"]["Row"];
  partylists: RouterOutputs["partylist"]["getDashboardData"];
}) {
  const partylistsQuery = api.partylist.getDashboardData.useQuery(
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

              {partylist.acronym !== "IND" && (
                <Flex gap="xs" justify="center">
                  {/* TODO: fix this */}
                  <EditPartylist partylist={{ ...partylist, logo_url: null }} />
                  <DeletePartylist partylist={partylist} />
                </Flex>
              )}
            </Flex>
          ))
        )}
      </Group>
    </Stack>
  );
}
