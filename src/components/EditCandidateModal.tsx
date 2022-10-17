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
  Select,
  Stack,
  Tooltip,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import {
  electionType,
  candidateType,
  partylistType,
  positionType,
} from "../types/typings";
import { v4 as uuidv4 } from "uuid";
import { TrashIcon } from "@heroicons/react/24/outline";
import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import { firestore } from "../firebase/firebase";

const EditCandidateModal = ({
  isOpen,
  onClose,
  election,
  partylists,
  positions,
  candidate,
}: {
  isOpen: boolean;
  onClose: () => void;
  election: electionType;
  partylists: partylistType[];
  positions: positionType[];
  candidate: candidateType;
}) => {
  const clearForm = () => {
    setCandidateData({
      id: uuidv4(),
      uid: "",
      firstName: "",
      middleName: "",
      lastName: "",
      photoUrl: "",
      position: "",
      partylist: "",
      votingCount: 0,
    });
  };
  const [candidateData, setCandidateData] = useState<candidateType>({
    id: uuidv4(),
    uid: "",
    firstName: "",
    middleName: "",
    lastName: "",
    photoUrl: "",
    position: "",
    partylist: "",
    votingCount: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    clearForm();
    setLoading(false);
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} trapFocus={false} isCentered>
      <ModalOverlay />
      <form
        onSubmit={async (e) => {
          setLoading(true);
          e.preventDefault();
          await addDoc(
            collection(firestore, "elections", election.uid, "candidates"),
            candidate
          ).then(async (docRef) => {
            await updateDoc(
              doc(
                firestore,
                "elections",
                election.uid,
                "candidates",
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
          <ModalHeader>Add a candidate</ModalHeader>
          <ModalCloseButton />

          <ModalBody pb={6}>
            <Stack spacing={4}>
              <FormControl isRequired>
                <FormLabel>First name</FormLabel>
                <Input
                  placeholder="Candidate first name"
                  onChange={(e) =>
                    setCandidateData({
                      ...candidateData,
                      firstName: e.target.value,
                    })
                  }
                  value={candidateData.firstName}
                  disabled={loading}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Middle name</FormLabel>
                <Input
                  placeholder="Candidate middle name"
                  onChange={(e) =>
                    setCandidateData({
                      ...candidateData,
                      middleName: e.target.value,
                    })
                  }
                  value={candidateData.middleName}
                  disabled={loading}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Last name</FormLabel>
                <Input
                  placeholder="Candidate last name"
                  onChange={(e) =>
                    setCandidateData({
                      ...candidateData,
                      lastName: e.target.value,
                    })
                  }
                  value={candidateData.lastName}
                  disabled={loading}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Image</FormLabel>
                <Input
                  type="file"
                  accept="image/*"
                  placeholder="Candidate last name"
                  onChange={(e) =>
                    setCandidateData({
                      ...candidateData,
                      lastName: e.target.value,
                    })
                  }
                  value={candidateData.lastName}
                  disabled={loading}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Partylist</FormLabel>
                <Select>
                  {partylists.map((partylist) => (
                    <option value={partylist.uid} key={partylist.id}>
                      {partylist.name} ({partylist.abbreviation})
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Position</FormLabel>
                <Select>
                  {positions.map((position) => (
                    <option value={position.uid} key={position.id}>
                      {position.title}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </ModalBody>

          <ModalFooter justifyContent="space-between">
            <Box>
              {(candidateData.firstName ||
                candidateData.middleName ||
                candidateData.middleName ||
                candidateData.position ||
                candidateData.partylist) && (
                <Tooltip label="Clear forms">
                  <IconButton
                    aria-label="Clear form"
                    icon={<TrashIcon width={18} />}
                    onClick={() => {
                      clearForm();
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
                disabled={
                  !candidateData.firstName ||
                  !candidateData.lastName ||
                  !candidateData.position ||
                  !candidateData.partylist
                }
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

export default EditCandidateModal;
