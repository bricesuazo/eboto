"use client";

import { type Partylist } from "@eboto-mo/db/schema";
import { Box, Center, Flex, Group, Title } from "@mantine/core";
import { IconFlag } from "@tabler/icons-react";
import UpdatePartylist from "@/components/client/modals/update-partylist";
import DeletePartylist from "../modals/delete-partylist";

export default function PartylistCard({ partylist }: { partylist: Partylist }) {
  return (
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
        <UpdatePartylist partylist={partylist} />
        <DeletePartylist partylist={partylist} />
      </Group>
    </Flex>
  );
}
