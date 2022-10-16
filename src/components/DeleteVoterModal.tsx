import {
  Box,
  Button,
  Flex,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import { TrashIcon } from "@heroicons/react/24/outline";
import {
  arrayRemove,
  collection,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { firestore } from "../firebase/firebase";
import { voterType } from "../types/typings";

interface DeleteVoterModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVoter: voterType;
}
const DeleteVoterModal = ({
  isOpen,
  onClose,
  selectedVoter,
}: DeleteVoterModalProps) => {
  const [loading, setLoading] = useState(false);
  const [voter, setVoter] = useState<voterType>(selectedVoter);

  useEffect(() => {
    setVoter(selectedVoter);
  }, [selectedVoter]);
  return (
    <Modal isOpen={isOpen} onClose={onClose} trapFocus={false} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Delete voter</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <Text>Are you sure you want to delete this voter?</Text>
        </ModalBody>

        <ModalFooter>
          <Button
            colorScheme="red"
            mr={3}
            type="submit"
            isLoading={loading}
            onClick={async () => {
              setLoading(true);
              // deleting voter
              await deleteDoc(
                doc(
                  collection(firestore, "elections", voter.election, "voters"),
                  voter.uid
                )
              );
              onClose();
              setLoading(false);
            }}
          >
            Delete
          </Button>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DeleteVoterModal;
