import {
  Box,
  Button,
  FormControl,
  FormLabel,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Tooltip,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { electionType, positionType } from "../types/typings";
import { TrashIcon } from "@heroicons/react/24/outline";
import { doc, Timestamp, updateDoc } from "firebase/firestore";
import { firestore } from "../firebase/firebase";

const EditPositionModal = ({
  isOpen,
  onClose,
  election,
  position,
}: {
  isOpen: boolean;
  onClose: () => void;
  election: electionType;
  position: positionType;
}) => {
  const clearForm = () => {
    setPositionData({
      title: position.title,
    });
  };
  const [positionData, setPositionData] = useState({
    title: position.title,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    clearForm();
    setLoading(false);
  }, [isOpen]);
  const isDisabled =
    position.title.trim() === positionData.title.trim() ||
    !positionData.title.trim();

  return (
    <Modal isOpen={isOpen} onClose={onClose} trapFocus={false}>
      <ModalOverlay />
      <form
        onSubmit={async (e) => {
          setLoading(true);
          e.preventDefault();
          await updateDoc(
            doc(
              firestore,
              "elections",
              election.uid,
              "positions",
              position.uid
            ),
            { ...positionData, updatedAt: Timestamp.now() }
          );
          await updateDoc(doc(firestore, "elections", election.uid), {
            updatedAt: Timestamp.now(),
          });
          onClose();
          setLoading(false);
        }}
      >
        <ModalContent>
          <ModalHeader>Edit position</ModalHeader>
          <ModalCloseButton />

          <ModalBody pb={6}>
            <Stack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Name</FormLabel>
                <Input
                  placeholder="position name"
                  onChange={(e) =>
                    setPositionData({ ...positionData, title: e.target.value })
                  }
                  value={positionData.title}
                  disabled={loading}
                />
              </FormControl>
            </Stack>
          </ModalBody>

          <ModalFooter justifyContent="space-between">
            <Box>
              {position.title && (
                <Tooltip label="Clear forms">
                  <IconButton
                    aria-label="Clear form"
                    icon={<TrashIcon width={18} />}
                    onClick={() => {
                      position.title && clearForm();
                    }}
                    disabled={loading || isDisabled}
                  />
                </Tooltip>
              )}
            </Box>
            <Box>
              <Button
                mr={3}
                type="submit"
                isLoading={loading}
                disabled={isDisabled}
              >
                Save
              </Button>
              <Button onClick={onClose} disabled={loading}>
                Cancel
              </Button>
            </Box>
          </ModalFooter>
        </ModalContent>
      </form>
    </Modal>
  );
};

export default EditPositionModal;
