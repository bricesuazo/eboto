import {
  Button,
  Center,
  Flex,
  Text,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import type { Position } from "@prisma/client";
import { api } from "../utils/api";
import EditPositionModal from "./modals/EditPosition";

const PositionCard = ({
  position,
  refetch,
}: {
  position: Position;
  refetch: () => void;
}) => {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const deletePositionMutation = api.position.deleteSingle.useMutation({
    onSuccess: (data) => {
      toast({
        title: `${data.name} deleted!`,
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
      <EditPositionModal
        isOpen={isOpen}
        onClose={() => {
          refetch();
          onClose();
        }}
        position={position}
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
          {position.name}
        </Text>

        <Flex>
          <Button onClick={onOpen} variant="ghost" size="sm" w="fit-content">
            Edit
          </Button>
          <Button
            onClick={() => deletePositionMutation.mutate(position.id)}
            isLoading={deletePositionMutation.isLoading}
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

export default PositionCard;
