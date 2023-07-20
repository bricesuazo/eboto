"use client";

import { Box, Center, Flex, Group, Stack, Text, Title } from "@mantine/core";
import { Election, type Partylist } from "@eboto-mo/db/schema";
import { IconFlag } from "@tabler/icons-react";
import CreatePartylist from "@/components/client/modals/create-partylist";
import DeletePartylist from "@/components/client/modals/delete-partylist";
import EditPartylist from "@/components/client/modals/edit-partylist";

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
            <Flex
              sx={(theme) => ({
                flexDirection: "column",
                justifyContent: "space-between",
                alignItems: "center",
                width: 180,
                height: 172,
                padding: theme.spacing.md,
                border: "1px solid",
                borderColor:
                  theme.colorScheme === "dark"
                    ? theme.colors.dark[5]
                    : theme.colors.gray[3],
                borderRadius: theme.radius.md,

                [theme.fn.smallerThan("xs")]: {
                  width: "100%",
                },
              })}
            >
              <Center sx={{ flexDirection: "column" }}>
                <Box>
                  <IconFlag size={40} />
                </Box>
                <Title order={4} lineClamp={2} align="center">
                  {partylist.name} ({partylist.acronym})
                </Title>
              </Center>

              <Group spacing="xs">
                <EditPartylist partylist={partylist} />
                <DeletePartylist partylist={partylist} />
              </Group>
            </Flex>
          ))
        )}
      </Group>
    </Stack>
  );
}
