import {
  Box,
  Button,
  Center,
  Flex,
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
  Text,
  Tooltip,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import {
  candidateType,
  electionType,
  partylistType,
  positionType,
} from "../types/typings";
import { v4 as uuidv4 } from "uuid";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import {
  addDoc,
  collection,
  doc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { firestore } from "../firebase/firebase";
import capitalizeFirstLetter from "../utils/capitalizeFirstLetter";

const AddCandidateModal = ({
  isOpen,
  onClose,
  election,
  partylists,
  position,
}: {
  isOpen: boolean;
  onClose: () => void;
  election: electionType;
  partylists: partylistType[];
  position: positionType;
}) => {
  const clearForm = () => {
    setCandidate({
      firstName: "",
      middleName: "",
      lastName: "",
      photoUrl: "",
      partylist: "",
      id: uuidv4(),
      uid: "",
      position: position?.uid,
      votingCount: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),

      credentials: {
        achievements: [],
        affiliations: [],
        seminarsAttended: [],
      },
    });
  };
  const [candidate, setCandidate] = useState<candidateType>({
    firstName: "",
    middleName: "",
    lastName: "",
    photoUrl: "",
    partylist: "",
    id: uuidv4(),
    uid: "",
    position: position?.uid,
    votingCount: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),

    credentials: {
      achievements: [],
      affiliations: [],
      seminarsAttended: [],
    },
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    clearForm();
    setLoading(false);
  }, [isOpen]);

  console.log(candidate.credentials.achievements);
  return (
    <Modal isOpen={isOpen} onClose={onClose} trapFocus={false} size="4xl">
      <ModalOverlay />
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          await addDoc(
            collection(firestore, "elections", election.uid, "candidates"),
            {
              ...candidate,
              firstName: capitalizeFirstLetter(candidate.firstName),

              middleName: candidate.middleName
                ? capitalizeFirstLetter(candidate.middleName)
                : "",
              lastName: capitalizeFirstLetter(candidate.lastName),
            }
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
          await updateDoc(doc(firestore, "elections", election.uid), {
            updatedAt: Timestamp.now(),
          });
          onClose();
          setLoading(false);
        }}
      >
        <ModalContent>
          <ModalHeader>Add a candidate</ModalHeader>
          <ModalCloseButton />

          <ModalBody pb={6}>
            <Flex gap={4} flexDirection={["column", "column", "row"]}>
              <Stack spacing={4} flex={1}>
                <FormControl isRequired>
                  <FormLabel>First name</FormLabel>
                  <Input
                    placeholder="Candidate first name"
                    onChange={(e) =>
                      setCandidate({
                        ...candidate,
                        firstName: e.target.value,
                      })
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
                      setCandidate({
                        ...candidate,
                        middleName: e.target.value,
                      })
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

                <FormControl isRequired>
                  <FormLabel>Partylist</FormLabel>
                  <Select
                    placeholder="Select partylist"
                    disabled={loading}
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
                        {partylist.name} ({partylist.abbreviation})
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Position</FormLabel>
                  <Input value={position?.title} readOnly />
                </FormControl>
                <FormControl>
                  <FormLabel>Image</FormLabel>
                  <Input type="file" accept="image/*" disabled={loading} />
                </FormControl>
              </Stack>
              <Stack flex={1} spacing={4}>
                <FormControl>
                  <FormLabel>Achievements</FormLabel>

                  <Stack>
                    {!candidate.credentials.achievements.length ? (
                      <Text>No achievements added</Text>
                    ) : (
                      candidate.credentials.achievements.map((achievement) => (
                        <FormControl key={achievement.id} isRequired>
                          <Flex justifyContent="space-between" gap={2}>
                            <Input
                              placeholder="Achievement title"
                              onChange={(e) =>
                                setCandidate({
                                  ...candidate,
                                  credentials: {
                                    ...candidate.credentials,
                                    achievements:
                                      candidate.credentials.achievements.map(
                                        (achievementToEdit) =>
                                          achievementToEdit.id ===
                                          achievement.id
                                            ? {
                                                ...achievementToEdit,
                                                title: e.target.value,
                                              }
                                            : achievementToEdit
                                      ),
                                  },
                                })
                              }
                              // value={candidate.lastName}
                              disabled={loading}
                            />
                            <IconButton
                              aria-label="Remove achievement"
                              icon={<TrashIcon width={18} />}
                              onClick={() => {
                                setCandidate({
                                  ...candidate,
                                  credentials: {
                                    ...candidate.credentials,
                                    achievements:
                                      candidate.credentials.achievements.filter(
                                        (achievementToRemove) =>
                                          achievementToRemove.id !==
                                          achievement.id
                                      ),
                                  },
                                });
                              }}
                              disabled={loading}
                            />
                          </Flex>
                        </FormControl>
                      ))
                    )}
                    <Button
                      onClick={() => {
                        candidate.credentials.achievements
                          ? setCandidate({
                              ...candidate,
                              credentials: {
                                ...candidate.credentials,
                                achievements: [
                                  ...candidate.credentials.achievements,
                                  {
                                    id: uuidv4(),
                                    title: "",
                                  },
                                ],
                              },
                            })
                          : setCandidate({
                              ...candidate,
                              credentials: {
                                ...candidate.credentials,
                                achievements: [
                                  {
                                    id: uuidv4(),
                                    title: "",
                                  },
                                ],
                              },
                            });
                      }}
                      disabled={loading}
                      size="sm"
                    >
                      Add achievement
                    </Button>
                  </Stack>
                </FormControl>
              </Stack>
              <Stack flex={1} spacing={4}>
                <FormControl>
                  <FormLabel>Affiliations</FormLabel>
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
                  <FormLabel>Seminars Attended</FormLabel>
                  <Input
                    placeholder="Candidate last name"
                    onChange={(e) =>
                      setCandidate({ ...candidate, lastName: e.target.value })
                    }
                    value={candidate.lastName}
                    disabled={loading}
                  />
                </FormControl>
              </Stack>
            </Flex>
          </ModalBody>

          <ModalFooter justifyContent="space-between">
            <Box>
              {(candidate.firstName ||
                candidate.middleName ||
                candidate.lastName ||
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
