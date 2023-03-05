import { Button, Center, Flex, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import type { Partylist } from "@prisma/client";
import { IconCheck } from "@tabler/icons-react";
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
        direction="column"
        w={172}
        align="center"
        p={8}
        sx={(theme) => ({
          border: "1px solid",
          borderColor:
            theme.colorScheme === "dark"
              ? theme.colors.dark[5]
              : theme.colors.gray[3],
          borderRadius: 8,
        })}
      >
        <Text align="center" w="full">
          {partylist.name} ({partylist.acronym})
        </Text>

        <Flex>
          <Button
            disabled={deletePartylistMutation.isLoading}
            onClick={open}
            variant="subtle"
            size="sm"
            compact
          >
            Edit
          </Button>
          <Button
            onClick={() => deletePartylistMutation.mutate(partylist.id)}
            loading={deletePartylistMutation.isLoading}
            variant="subtle"
            color="red"
            size="sm"
            compact
          >
            Delete
          </Button>
        </Flex>
      </Flex>
    </>
  );
};

export default PartylistCard;
