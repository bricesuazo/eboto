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
import { addDoc, collection, doc, query, updateDoc } from "firebase/firestore";
import { firestore } from "../firebase/firebase";
import { useFirestoreCollectionData } from "reactfire";

const AddCandidateModal = ({
  isOpen,
  onClose,
  election,
}: {
  isOpen: boolean;
  onClose: () => void;
  election: electionType;
}) => {
  const clearForm = () => {
    setCandidate({
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
  const [candidate, setCandidate] = useState<candidateType>({
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

  const { status: statusPartylists, data: partylistsData } =
    useFirestoreCollectionData(
      query(collection(firestore, "elections", election.uid, "partylists"))
    );
  const { status: statusPositions, data: positionsData } =
    useFirestoreCollectionData(
      query(collection(firestore, "elections", election.uid, "positions"))
    );
  const [partylists, setPartylists] = useState<partylistType[]>();
  const [positions, setPositions] = useState<positionType[]>();
  useEffect(() => {
    if (statusPartylists === "success") {
      setPartylists(partylistsData as partylistType[]);
    }
    if (statusPositions === "success") {
      setPositions(positionsData as positionType[]);
    }
  }, [partylistsData, positionsData]);
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
                    setCandidate({ ...candidate, firstName: e.target.value })
                  }
                  value={candidate.firstName}
                  disabled={loading}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Middle name</FormLabel>
                <Input
                  placeholder="Candidate middle name"
                  onChange={(e) =>
                    setCandidate({ ...candidate, middleName: e.target.value })
                  }
                  value={candidate.middleName}
                  disabled={loading}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Last name</FormLabel>
                <Input
                  placeholder="Candidate last name"
                  onChange={(e) =>
                    setCandidate({ ...candidate, lastName: e.target.value })
                  }
                  value={candidate.lastName}
                  disabled={loading}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Image</FormLabel>
                <Input type="file" accept="image/*" disabled={loading} />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Partylist</FormLabel>
                <Select
                  placeholder="Select partylist"
                  disabled={statusPartylists === "loading"}
                  onChange={(e) => {
                    setCandidate({
                      ...candidate,
                      partylist: e.target.value,
                    });
                  }}
                  value={candidate.partylist}
                >
                  {partylists?.map((partylist) => (
                    <option value={partylist.uid} key={partylist.id}>
                      {statusPartylists === "loading" && "Loading..."}
                      {partylist.name} ({partylist.abbreviation})
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Position</FormLabel>
                <Select
                  placeholder="Select position"
                  disabled={statusPositions === "loading"}
                  onChange={(e) => {
                    setCandidate({
                      ...candidate,
                      position: e.target.value,
                    });
                  }}
                  value={candidate.position}
                >
                  {positions?.map((position) => (
                    <option value={position.uid} key={position.id}>
                      {statusPositions === "loading" && "Loading..."}
                      {position.title}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </ModalBody>

          <ModalFooter justifyContent="space-between">
            <Box>
              {(candidate.firstName ||
                candidate.middleName ||
                candidate.lastName ||
                candidate.position ||
                candidate.partylist) && (
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
                  !candidate.firstName ||
                  !candidate.lastName ||
                  !candidate.position ||
                  !candidate.partylist
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

export default AddCandidateModal;
