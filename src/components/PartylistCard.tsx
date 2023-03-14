import { Box, Button, Center, Flex, Group, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import type { Partylist } from "@prisma/client";
import { IconCheck, IconFlag } from "@tabler/icons-react";
import { api } from "../utils/api";
import EditPartylistModal from "./modals/EditPartylist";

const PartylistCard = ({
  partylist,
  refetch,
}: {
  partylist: Partylist;
  refetch: () => Promise<unknown>;
}) => {
  const [opened, { open, close }] = useDisclosure(false);
  const deletePartylistMutation = api.partylist.deleteSingle.useMutation({
    onSuccess: async (data) => {
      await refetch();
      notifications.show({
        title: `${data.name} (${data.acronym}) deleted!`,
        message: "Successfully deleted partylist",
        icon: <IconCheck size="1.1rem" />,
        autoClose: 5000,
      });
    },
  });

  return (
    <>
      <EditPartylistModal
        isOpen={opened}
        onClose={close}
        partylist={partylist}
        refetch={refetch}
      />
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
          <Button
            disabled={deletePartylistMutation.isLoading}
            onClick={open}
            variant="light"
            size="sm"
            compact
          >
            Edit
          </Button>
          <Button
            onClick={() => deletePartylistMutation.mutate(partylist.id)}
            loading={deletePartylistMutation.isLoading}
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
};

export default PartylistCard;
