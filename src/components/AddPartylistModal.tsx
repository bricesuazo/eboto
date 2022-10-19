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
import { electionType, partylistType } from "../types/typings";
import { v4 as uuidv4 } from "uuid";
import { TrashIcon } from "@heroicons/react/24/outline";
import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import { firestore } from "../firebase/firebase";

const AddPartylistModal = ({
  isOpen,
  onClose,
  election,
}: {
  isOpen: boolean;
  onClose: () => void;
  election: electionType;
}) => {
  const clearForm = () => {
    setPartylist({
      uid: "",
      id: uuidv4(),
      name: "",
      abbreviation: "",
      logo: "",
      description: "",
    });
  };
  const [partylist, setPartylist] = useState<partylistType>({
    uid: "",
    id: uuidv4(),
    name: "",
    abbreviation: "",
    logo: "",
    description: "",
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
          setLoading(true);
          e.preventDefault();
          await addDoc(
            collection(firestore, "elections", election.uid, "partylists"),
            {
              ...partylist,
              name: partylist.name.trim(),
              abbreviation: partylist.abbreviation.trim(),
            }
          ).then(async (docRef) => {
            await updateDoc(
              doc(
                firestore,
                "elections",
                election.uid,
                "partylists",
                docRef.id
              ),
              {
                uid: docRef.id,
              }
            );
          });
          onClose();
          setLoading(false);
        }}
      >
        <ModalContent>
          <ModalHeader>Add a partylist</ModalHeader>
          <ModalCloseButton />

          <ModalBody pb={6}>
            <Stack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Name</FormLabel>
                <Input
                  placeholder="Partylist name"
                  onChange={(e) =>
                    setPartylist({ ...partylist, name: e.target.value })
                  }
                  value={partylist.name}
                  disabled={loading}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Abbreviation</FormLabel>
                <Input
                  placeholder="Partylist abbreviation"
                  onChange={(e) =>
                    setPartylist({ ...partylist, abbreviation: e.target.value })
                  }
                  value={partylist.abbreviation}
                  disabled={loading}
                />
              </FormControl>
            </Stack>
          </ModalBody>

          <ModalFooter justifyContent="space-between">
            <Box>
              {(partylist.name || partylist.abbreviation) && (
                <Tooltip label="Clear forms">
                  <IconButton
                    aria-label="Clear form"
                    icon={<TrashIcon width={18} />}
                    onClick={() => {
                      (partylist.name || partylist.abbreviation) && clearForm();
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
                disabled={!partylist.name || !partylist.abbreviation}
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

export default AddPartylistModal;
