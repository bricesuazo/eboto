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
      <Center w={48} h={32} p={4}>
        <Text align="center" w="full">
          {partylist.name} ({partylist.acronym})
        </Text>

        <Flex>
          <Button onClick={open} variant="ghost" size="sm" w="fit-content">
            Edit
          </Button>
          <Button
            onClick={() => deletePartylistMutation.mutate(partylist.id)}
            loading={deletePartylistMutation.isLoading}
            variant="ghost"
            color="red"
            size="sm"
            w="fit-content"
          >
            Delete
          </Button>
        </Flex>
      </Center>
    </>
  );
};

export default PartylistCard;
