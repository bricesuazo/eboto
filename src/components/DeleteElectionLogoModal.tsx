import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from "@chakra-ui/react";
import { Timestamp, doc, updateDoc } from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";
import { useState } from "react";
import { firestore, storage } from "../firebase/firebase";
import { electionType } from "../types/typings";
import { useRouter } from "next/router";

interface DeleteVoterModalProps {
  isOpen: boolean;
  onClose: () => void;
  election: electionType;
}
const DeleteVoterModal = ({
  isOpen,
  onClose,
  election,
}: DeleteVoterModalProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <Modal isOpen={isOpen} onClose={onClose} trapFocus={false} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Delete election logo</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <Text>Are you sure you want to delete the election logo?</Text>
        </ModalBody>

        <ModalFooter>
          <Button
            colorScheme="red"
            mr={3}
            type="submit"
            isLoading={loading}
            onClick={async () => {
              setLoading(true);
              await updateDoc(doc(firestore, "elections", election.uid), {
                logoUrl: "",
                updatedAt: Timestamp.now(),
              }).then(async () => {
                await deleteObject(
                  ref(storage, `elections/${election.uid}/photo`)
                );
              });
              setLoading(false);
              onClose();
              router.reload();
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
