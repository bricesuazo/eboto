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
import { TrashIcon } from "@heroicons/react/24/outline";
import { arrayRemove, doc, writeBatch } from "firebase/firestore";
import { Session } from "next-auth";
import { useState } from "react";
import { electionType } from "../types/typings";
import Router from "next/router";
import reloadSession from "../utils/reloadSession";
import { firestore } from "../firebase/firebase";

const DeleteElectionModal = ({
  election,
  isOpen,
  onClose,
  session,
}: {
  election: electionType;
  isOpen: boolean;
  onClose: () => void;
  session: Session;
}) => {
  const [deleteLoading, setDeleteLoading] = useState(false);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Delete {election.name}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text>
            Are you sure you want to delete this election? This process cannot
            be undone.
          </Text>
        </ModalBody>

        <ModalFooter>
          <Button mr={3} onClick={onClose} disabled={deleteLoading}>
            Close
          </Button>
          <Button
            leftIcon={<TrashIcon width={16} />}
            variant="outline"
            color="red.400"
            borderColor="red.400"
            isLoading={deleteLoading}
            onClick={async () => {
              setDeleteLoading(true);

              const batch = writeBatch(firestore);
              session &&
                batch.update(doc(firestore, "admins", session.user.uid), {
                  elections: arrayRemove(election.uid),
                });
              batch.delete(doc(firestore, "elections", election.uid));
              await batch.commit();

              reloadSession();
              onClose();
              setDeleteLoading(false);
              Router.push("/dashboard");
            }}
          >
            Delete
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DeleteElectionModal;
