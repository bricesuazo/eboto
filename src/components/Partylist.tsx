import { Button, Center, Stack, Text, useDisclosure } from "@chakra-ui/react";
import type { Partylist } from "@prisma/client";
import EditPartylistModal from "./modals/EditPartylist";

const PartylistCard = ({
  partylist,
  refetch,
}: {
  partylist: Partylist;
  refetch: () => void;
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
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

        <Button onClick={onOpen} variant="ghost" size="sm" w="fit-content">
          Edit
        </Button>
      </Center>
    </>
  );
};

export default PartylistCard;
