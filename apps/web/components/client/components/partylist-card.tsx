"use client";

import { type Partylist } from "@eboto-mo/db/schema";
import { Box, Button, Center, Flex, Group, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconFlag } from "@tabler/icons-react";

export default function PartylistCard({ partylist }: { partylist: Partylist }) {
  const [
    openedEditPartylist,
    { open: openEditPartylist, close: closeEditPartylist },
  ] = useDisclosure(false);
  const [
    openedConfirmDeletePartylist,
    { open: openConfirmDeletePartylist, close: closeConfirmDeletePartylist },
  ] = useDisclosure(false);

  return (
    <>
      {/* <ConfirmDeletePartylistModal
          isOpen={openedConfirmDeletePartylist}
          onClose={closeConfirmDeletePartylist}
          partylist={partylist}
        />
        <EditPartylistModal
          isOpen={openedEditPartylist}
          onClose={closeEditPartylist}
          partylist={partylist}
        /> */}
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
          <Button onClick={openEditPartylist} variant="light" size="sm" compact>
            Edit
          </Button>
          <Button
            onClick={openConfirmDeletePartylist}
            variant="light"
            color="red"
            size="sm"
            compact
          >
            Delete
          </Button>
        </Group>
      </Flex>
    </>
  );
}
