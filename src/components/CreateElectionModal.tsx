import {
  Button,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputLeftAddon,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
} from "@chakra-ui/react";
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  DocumentData,
  updateDoc,
} from "firebase/firestore";
import React, { useState } from "react";
import { electionType } from "../types/typings";
import { auth, firestore } from "../firebase/firebase";
import { v4 as uuidv4 } from "uuid";
import { useAuthState } from "react-firebase-hooks/auth";
import Router from "next/router";

const CreateElectionModal = ({
  isOpen,
  cantClose,
  onClose,
}: {
  isOpen: boolean;
  cantClose?: boolean;
  onClose: () => void;
}) => {
  const [election, setElection] = useState<electionType>({
    _id: "",
    id: uuidv4(),
    name: "",
    about: "",
    electionIdName: "",
    ongoing: false,
    partylists: [
      {
        id: uuidv4(),
        title: "Independent",
        acronym: "IND",
      },
    ],
    positions: [],
    candidates: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const [loading, setLoading] = useState(false);
  const [user] = useAuthState(auth);

  return (
    <Modal isOpen={cantClose ? true : isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);

            await addDoc(collection(firestore, "elections"), election).then(
              async (electionSnap) => {
                user &&
                  (await updateDoc(doc(firestore, "admins", user.uid), {
                    elections: arrayUnion(electionSnap.id),
                  }));
                await updateDoc(doc(firestore, "elections", electionSnap.id), {
                  _id: electionSnap.id,
                });
              }
            );
            const electionIdName = election.electionIdName;
            setElection({ ...election, name: "", electionIdName: "" });
            setLoading(false);
            onClose();
            Router.push(`/${electionIdName}/dashboard`);
          }}
        >
          <ModalHeader>Create an election</ModalHeader>
          {!cantClose && <ModalCloseButton />}
          <ModalBody pb={6}>
            <FormControl isRequired>
              <FormLabel>Election Name</FormLabel>
              <Input
                placeholder="Election Name"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setElection({
                    ...election,
                    name: e.target.value,
                  });
                }}
                value={election.name}
              />
            </FormControl>

            <FormControl mt={4} isRequired>
              <FormLabel>Election ID</FormLabel>
              <InputGroup>
                <InputLeftAddon children="eboto-mo.com/" />
                <Input
                  placeholder="Election ID"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setElection({
                      ...election,
                      electionIdName: e.target.value,
                    });
                  }}
                  value={election.electionIdName}
                />
              </InputGroup>
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button
              colorScheme="blue"
              type="submit"
              mr={!cantClose ? 3 : 0}
              isLoading={loading}
            >
              Create
            </Button>
            {!cantClose && <Button onClick={onClose}>Cancel</Button>}
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default CreateElectionModal;
