import {
  Button,
  Center,
  Flex,
  Text,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import type { Partylist } from "@prisma/client";
import { api } from "../utils/api";
import EditPartylistModal from "./modals/EditPartylist";

const PartylistCard = ({
  partylist,
  refetch,
}: {
  partylist: Partylist;
  refetch: () => void;
}) => {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const deletePartylistMutation = api.partylist.deleteSingle.useMutation({
    onSuccess: () => {
      toast({
        title: `${partylist.name} (${partylist.acronym}) deleted!`,
        description: "Successfully deleted partylist",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      refetch();
    },
  });

  return (
    <>
      <EditPartylistModal
        isOpen={isOpen}
        onClose={() => {
          refetch();
          onClose();
        }}
        partylist={partylist}
      />
      <Center
        flexDirection="column"
        gap={2}
        w={48}
        h={32}
        border="1px"
        borderColor="gray.300"
        borderRadius="md"
        _dark={{
          borderColor: "gray.700",
        }}
        p={4}
      >
        <Text textAlign="center" w="full">
          {partylist.name} ({partylist.acronym})
        </Text>

        <Flex>
          <Button onClick={onOpen} variant="ghost" size="sm" w="fit-content">
            Edit
          </Button>
          <Button
            onClick={() => deletePartylistMutation.mutate(partylist.id)}
            isLoading={deletePartylistMutation.isLoading}
            variant="ghost"
            colorScheme="red"
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
