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
import { TrashIcon } from "@heroicons/react/24/outline";
import { doc, Timestamp, updateDoc } from "firebase/firestore";
import { firestore } from "../firebase/firebase";
import capitalizeFirstLetter from "../utils/capitalizeFirstLetter";

const EditCandidateModal = ({
  isOpen,
  onClose,
  election,
  candidate,
  partylists,
  positions,
}: {
  isOpen: boolean;
  onClose: () => void;
  election: electionType;
  candidate: candidateType;
  partylists: partylistType[];
  positions: positionType[];
}) => {
  const clearForm = () => {
    setCandidateData({
      id: candidate.id,
      uid: candidate.uid,
      firstName: candidate.firstName,
      middleName: candidate.middleName,
      lastName: candidate.lastName,
      photoUrl: candidate.photoUrl,
      position: candidate.position,
      partylist: candidate.partylist,
      votingCount: candidate.votingCount,
      createdAt: candidate.createdAt,
      updatedAt: candidate.updatedAt,
    });
  };
  const [candidateData, setCandidateData] = useState<candidateType>({
    id: candidate.id,
    uid: candidate.uid,
    firstName: candidate.firstName,
    middleName: candidate.middleName,
    lastName: candidate.lastName,
    photoUrl: candidate.photoUrl,
    position: candidate.position,
    partylist: candidate.partylist,
    votingCount: candidate.votingCount,
    createdAt: candidate.createdAt,
    updatedAt: candidate.updatedAt,
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
          await updateDoc(
            doc(
              firestore,
              "elections",
              election.uid,
              "candidates",
              candidate.uid
            ),
            {
              firstName: capitalizeFirstLetter(candidateData.firstName),
              middleName: candidateData.middleName
                ? capitalizeFirstLetter(candidateData.middleName)
                : "",
              lastName: capitalizeFirstLetter(candidateData.lastName),
              photoUrl: candidateData.photoUrl,
              position: candidateData.position,
              partylist: candidateData.partylist,
              updatedAt: Timestamp.now(),
            }
          );
          await updateDoc(doc(firestore, "elections", election.uid), {
            updatedAt: Timestamp.now(),
          });
          clearForm();
          onClose();
          setLoading(false);
        }}
      >
        <ModalContent>
          <ModalHeader>Edit a candidate</ModalHeader>
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
                  placeholder="Candidate photo"
                  disabled={loading}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Partylist</FormLabel>
                <Select
                  onChange={(e) => {
                    setCandidateData({
                      ...candidateData,
                      partylist: e.target.value,
                    });
                  }}
                  value={candidateData.partylist}
                >
                  {partylists.map((partylist) => (
                    <option value={partylist.uid} key={partylist.id}>
                      {partylist.name} ({partylist.abbreviation})
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Position</FormLabel>
                <Select
                  onChange={(e) => {
                    setCandidateData({
                      ...candidateData,
                      position: e.target.value,
                    });
                  }}
                  value={candidateData.position}
                >
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
              {(((candidateData.firstName ||
                candidateData.lastName ||
                candidateData.position ||
                candidateData.partylist) &&
                candidate.firstName !== candidateData.firstName) ||
                candidate.middleName !== candidateData.middleName ||
                candidate.lastName !== candidateData.lastName ||
                candidate.position !== candidateData.position ||
                candidate.partylist !== candidateData.partylist) && (
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
                  !candidateData.partylist ||
                  (candidate.firstName === candidateData.firstName &&
                    candidate.middleName === candidateData.middleName &&
                    candidate.lastName === candidateData.lastName &&
                    candidate.position === candidateData.position &&
                    candidate.partylist === candidateData.partylist)
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
