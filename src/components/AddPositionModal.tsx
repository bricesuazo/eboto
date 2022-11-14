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
import { v4 as uuidv4 } from "uuid";
import { TrashIcon } from "@heroicons/react/24/outline";
import {
  addDoc,
  collection,
  doc,
  updateDoc,
  Timestamp,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import { firestore } from "../firebase/firebase";

const AddPositionModal = ({
  isOpen,
  onClose,
  election,
}: {
  isOpen: boolean;
  onClose: () => void;
  election: electionType;
}) => {
  const clearForm = () => {
    setPosition({
      order: 0,
      uid: "",
      id: uuidv4(),
      title: "",
      undecidedVotingCount: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  };
  const [position, setPosition] = useState<positionType>({
    order: 0,
    uid: "",
    id: uuidv4(),
    title: "",
    undecidedVotingCount: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    clearForm();
    setLoading(false);
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} trapFocus={false}>
      <ModalOverlay />
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          const positions = await getDocs(
            query(
              collection(firestore, "elections", election.uid, "positions"),
              orderBy("order")
            )
          );
          await addDoc(
            collection(firestore, "elections", election.uid, "positions"),
            {
              ...position,
              order: positions.docs[positions.size - 1].data().order + 1,
              title: position.title.trim(),
            }
          ).then(async (docRef) => {
            await updateDoc(
              doc(firestore, "elections", election.uid, "positions", docRef.id),
              {
                uid: docRef.id,
              }
            );
          });
          await updateDoc(doc(firestore, "elections", election.uid), {
            updatedAt: Timestamp.now(),
          });
          onClose();
          setLoading(false);
        }}
      >
        <ModalContent>
          <ModalHeader>Add a position</ModalHeader>
          <ModalCloseButton />

          <ModalBody pb={6}>
            <Stack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Position Title</FormLabel>
                <Input
                  placeholder="Position title"
                  onChange={(e) =>
                    setPosition({ ...position, title: e.target.value })
                  }
                  value={position.title}
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
                    disabled={loading}
                  />
                </Tooltip>
              )}
            </Box>
            <Box>
              <Button
                colorScheme="blue"
                mr={3}
                type="submit"
                isLoading={loading}
                disabled={!position.title}
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

export default AddPositionModal;
