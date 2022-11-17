import {
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
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
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
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
import {
  collection,
  doc,
  getDocs,
  query,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { firestore } from "../firebase/firebase";
import capitalizeFirstLetter from "../utils/capitalizeFirstLetter";
import ReactDatePicker from "react-datepicker";
import { v4 as uuidv4 } from "uuid";
import deepEqual from "deep-equal";

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
    setCandidateData(candidate);
  };
  const [candidateData, setCandidateData] = useState<candidateType>(candidate);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{
    type: "slug";
    error: string;
  } | null>(null);

  useEffect(() => {
    clearForm();
    setLoading(false);
    setError(null);
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} trapFocus={false} size="2xl">
      <ModalOverlay />
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          setLoading(true);

          if (deepEqual(candidate, candidateData)) return;
          const slug =
            candidateData.slug.charAt(candidateData.slug.length - 1) === "-"
              ? candidateData.slug.slice(0, candidateData.slug.length - 1)
              : candidateData.slug;
          const slugDoc = await getDocs(
            query(
              collection(firestore, "elections", election.uid, "candidates"),
              where("slug", "==", slug)
            )
          );
          if (!slugDoc.empty) {
            setError({
              type: "slug",
              error: "Slug is already taken",
            });
            setLoading(false);
            return;
          }

          await updateDoc(
            doc(
              firestore,
              "elections",
              election.uid,
              "candidates",
              candidateData.uid
            ),
            {
              firstName: capitalizeFirstLetter(candidateData.firstName),
              middleName: candidateData.middleName
                ? capitalizeFirstLetter(candidateData.middleName)
                : "",
              lastName: capitalizeFirstLetter(candidateData.lastName),
              slug,
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
            <Tabs variant="enclosed">
              <TabList overflow="auto hidden">
                <Tab>Basic Information</Tab>
                <Tab>Image</Tab>
                <Tab>Achievements</Tab>
                <Tab>Affiliations</Tab>
                <Tab>Seminars Attended</Tab>
              </TabList>
              <TabPanels>
                <TabPanel>
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
                    <FormControl isRequired isInvalid={error?.type === "slug"}>
                      <FormLabel>Slug</FormLabel>
                      <Input
                        placeholder="Candidate slug"
                        onChange={(e) =>
                          setCandidateData({
                            ...candidateData,
                            slug: e.target.value,
                          })
                        }
                        value={candidateData.slug}
                        disabled={loading}
                      />
                      {error?.type === "slug" && (
                        <FormErrorMessage>{error.error}</FormErrorMessage>
                      )}
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
                </TabPanel>
                <TabPanel>
                  <FormControl>
                    <FormLabel>Image</FormLabel>
                    <Input type="file" accept="image/*" disabled={loading} />
                  </FormControl>
                </TabPanel>
                <TabPanel>
                  <FormControl>
                    <FormLabel>Achievements</FormLabel>

                    <Stack>
                      {!candidateData.credentials.achievements.length ? (
                        <Text>No achievements added</Text>
                      ) : (
                        candidateData.credentials.achievements.map(
                          (achievement) => (
                            <FormControl key={achievement.id} isRequired>
                              <Flex justifyContent="space-between" gap={2}>
                                <Input
                                  placeholder="Achievement title"
                                  onChange={(e) =>
                                    setCandidateData({
                                      ...candidateData,
                                      credentials: {
                                        ...candidateData.credentials,
                                        achievements:
                                          candidateData.credentials.achievements.map(
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
                                  value={achievement.title}
                                  disabled={loading}
                                />
                                <IconButton
                                  aria-label="Remove achievement"
                                  icon={<TrashIcon width={18} />}
                                  onClick={() => {
                                    setCandidateData({
                                      ...candidateData,
                                      credentials: {
                                        ...candidateData.credentials,
                                        achievements:
                                          candidateData.credentials.achievements.filter(
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
                          )
                        )
                      )}
                      <Button
                        onClick={() => {
                          if (
                            candidateData.credentials.achievements.length &&
                            candidateData.credentials.achievements[
                              candidateData.credentials.achievements.length - 1
                            ].title === ""
                          )
                            return;
                          setCandidateData({
                            ...candidateData,
                            credentials: {
                              ...candidateData.credentials,
                              achievements: [
                                ...candidateData.credentials.achievements,
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
                </TabPanel>
                <TabPanel>
                  <FormControl>
                    <FormLabel>Affiliations</FormLabel>
                    <Stack>
                      {!candidateData.credentials.affiliations.length ? (
                        <Text>No affiliations added</Text>
                      ) : (
                        candidateData.credentials.affiliations.map(
                          (affiliation) => (
                            <FormControl key={affiliation.id} isRequired>
                              <Stack>
                                <Flex justifyContent="space-between" gap={2}>
                                  <Input
                                    placeholder="Organization name"
                                    onChange={(e) =>
                                      setCandidateData({
                                        ...candidateData,
                                        credentials: {
                                          ...candidateData.credentials,
                                          affiliations:
                                            candidateData.credentials.affiliations.map(
                                              (affiliationToEdit) =>
                                                affiliationToEdit.id ===
                                                affiliation.id
                                                  ? {
                                                      ...affiliationToEdit,
                                                      organizationName:
                                                        e.target.value,
                                                    }
                                                  : affiliationToEdit
                                            ),
                                        },
                                      })
                                    }
                                    value={affiliation.organizationName}
                                  />
                                  <IconButton
                                    aria-label="Remove affiliation"
                                    icon={<TrashIcon width={18} />}
                                    onClick={() => {
                                      setCandidateData({
                                        ...candidateData,
                                        credentials: {
                                          ...candidateData.credentials,
                                          affiliations:
                                            candidateData.credentials.affiliations.filter(
                                              (affiliationToRemove) =>
                                                affiliationToRemove.id !==
                                                affiliation.id
                                            ),
                                        },
                                      });
                                    }}
                                  />
                                </Flex>
                                <Input
                                  placeholder="Position in the organization"
                                  onChange={(e) =>
                                    setCandidateData({
                                      ...candidateData,
                                      credentials: {
                                        ...candidateData.credentials,
                                        affiliations:
                                          candidateData.credentials.affiliations.map(
                                            (affiliationToEdit) =>
                                              affiliationToEdit.id ===
                                              affiliation.id
                                                ? {
                                                    ...affiliationToEdit,
                                                    position: e.target.value,
                                                  }
                                                : affiliationToEdit
                                          ),
                                      },
                                    })
                                  }
                                  value={affiliation.position}
                                />
                                <Flex gap={2} flex={1}>
                                  <ReactDatePicker
                                    selected={affiliation.startDate?.toDate()}
                                    onChange={(date) =>
                                      date &&
                                      setCandidateData({
                                        ...candidateData,
                                        credentials: {
                                          ...candidateData.credentials,
                                          affiliations:
                                            candidateData.credentials.affiliations.map(
                                              (affiliationToEdit) =>
                                                affiliationToEdit.id ===
                                                affiliation.id
                                                  ? {
                                                      ...affiliationToEdit,
                                                      startDate:
                                                        Timestamp.fromDate(
                                                          date
                                                        ),
                                                    }
                                                  : affiliationToEdit
                                            ),
                                        },
                                      })
                                    }
                                    showYearPicker
                                    dateFormat="yyyy"
                                    placeholderText="Start date"
                                  />
                                  <ReactDatePicker
                                    selected={affiliation.endDate?.toDate()}
                                    onChange={(date) =>
                                      date &&
                                      setCandidateData({
                                        ...candidateData,
                                        credentials: {
                                          ...candidateData.credentials,
                                          affiliations:
                                            candidateData.credentials.affiliations.map(
                                              (affiliationToEdit) =>
                                                affiliationToEdit.id ===
                                                affiliation.id
                                                  ? {
                                                      ...affiliationToEdit,
                                                      endDate:
                                                        Timestamp.fromDate(
                                                          date
                                                        ),
                                                    }
                                                  : affiliationToEdit
                                            ),
                                        },
                                      })
                                    }
                                    showYearPicker
                                    dateFormat="yyyy"
                                    placeholderText="End date"
                                    disabled={!affiliation.startDate?.toDate()}
                                    minDate={affiliation.startDate?.toDate()}
                                  />
                                </Flex>
                              </Stack>
                            </FormControl>
                          )
                        )
                      )}
                      <Button
                        onClick={() => {
                          if (
                            candidateData.credentials.affiliations.length &&
                            candidateData.credentials.affiliations[
                              candidateData.credentials.affiliations.length - 1
                            ].organizationName === "" &&
                            candidateData.credentials.affiliations[
                              candidateData.credentials.affiliations.length - 1
                            ].position === "" &&
                            !candidateData.credentials.affiliations[
                              candidateData.credentials.affiliations.length - 1
                            ].startDate &&
                            !candidateData.credentials.affiliations[
                              candidateData.credentials.affiliations.length - 1
                            ].endDate
                          )
                            return;
                          setCandidateData({
                            ...candidateData,
                            credentials: {
                              ...candidateData.credentials,
                              affiliations: [
                                ...candidateData.credentials.affiliations,
                                {
                                  id: uuidv4(),
                                  organizationName: "",
                                  position: "",
                                  startDate: null,
                                  endDate: null,
                                },
                              ],
                            },
                          });
                        }}
                        disabled={loading}
                        size="sm"
                      >
                        Add affiliation
                      </Button>
                    </Stack>
                  </FormControl>
                </TabPanel>
                <TabPanel>
                  <FormControl>
                    <FormLabel>Seminars Attended</FormLabel>
                    <Stack>
                      {!candidateData.credentials.seminarsAttended.length ? (
                        <Text>No seminars attended added</Text>
                      ) : (
                        candidateData.credentials.seminarsAttended.map(
                          (seminarsAttended) => (
                            <FormControl key={seminarsAttended.id} isRequired>
                              <Flex justifyContent="space-between" gap={2}>
                                <Input
                                  placeholder="Seminar attended title"
                                  onChange={(e) =>
                                    setCandidateData({
                                      ...candidateData,
                                      credentials: {
                                        ...candidateData.credentials,
                                        seminarsAttended:
                                          candidateData.credentials.seminarsAttended.map(
                                            (seminarsAttendedToEdit) =>
                                              seminarsAttendedToEdit.id ===
                                              seminarsAttended.id
                                                ? {
                                                    ...seminarsAttendedToEdit,
                                                    name: e.target.value,
                                                  }
                                                : seminarsAttendedToEdit
                                          ),
                                      },
                                    })
                                  }
                                  value={seminarsAttended.name}
                                  disabled={loading}
                                />
                                <IconButton
                                  aria-label="Remove seminar attended"
                                  icon={<TrashIcon width={18} />}
                                  onClick={() => {
                                    setCandidateData({
                                      ...candidateData,
                                      credentials: {
                                        ...candidateData.credentials,
                                        seminarsAttended:
                                          candidateData.credentials.seminarsAttended.filter(
                                            (seminarsAttendedToRemove) =>
                                              seminarsAttendedToRemove.id !==
                                              seminarsAttended.id
                                          ),
                                      },
                                    });
                                  }}
                                  disabled={loading}
                                />
                              </Flex>
                              <Flex gap={2} flex={1}>
                                <ReactDatePicker
                                  selected={seminarsAttended.startDate?.toDate()}
                                  onChange={(date) =>
                                    date &&
                                    setCandidateData({
                                      ...candidateData,
                                      credentials: {
                                        ...candidateData.credentials,
                                        seminarsAttended:
                                          candidateData.credentials.seminarsAttended.map(
                                            (seminarsAttendedToEdit) =>
                                              seminarsAttendedToEdit.id ===
                                              seminarsAttended.id
                                                ? {
                                                    ...seminarsAttendedToEdit,
                                                    startDate:
                                                      Timestamp.fromDate(date),
                                                  }
                                                : seminarsAttendedToEdit
                                          ),
                                      },
                                    })
                                  }
                                  showYearPicker
                                  dateFormat="yyyy"
                                  placeholderText="Start date"
                                />
                                <ReactDatePicker
                                  selected={seminarsAttended.endDate?.toDate()}
                                  onChange={(date) =>
                                    date &&
                                    setCandidateData({
                                      ...candidateData,
                                      credentials: {
                                        ...candidateData.credentials,
                                        seminarsAttended:
                                          candidateData.credentials.seminarsAttended.map(
                                            (seminarsAttendedToEdit) =>
                                              seminarsAttendedToEdit.id ===
                                              seminarsAttended.id
                                                ? {
                                                    ...seminarsAttendedToEdit,
                                                    endDate:
                                                      Timestamp.fromDate(date),
                                                  }
                                                : seminarsAttendedToEdit
                                          ),
                                      },
                                    })
                                  }
                                  showYearPicker
                                  dateFormat="yyyy"
                                  placeholderText="End date"
                                  disabled={
                                    !seminarsAttended.startDate?.toDate()
                                  }
                                  minDate={seminarsAttended.startDate?.toDate()}
                                />
                              </Flex>
                            </FormControl>
                          )
                        )
                      )}
                      <Button
                        onClick={() => {
                          const lastSeminarAttended = candidateData.credentials
                            .seminarsAttended[
                            candidateData.credentials.seminarsAttended.length -
                              1
                          ]
                            ? candidateData.credentials.seminarsAttended[
                                candidateData.credentials.seminarsAttended
                                  .length - 1
                              ]
                            : null;
                          if (
                            lastSeminarAttended &&
                            lastSeminarAttended.name === "" &&
                            lastSeminarAttended.startDate === null &&
                            lastSeminarAttended.endDate === null
                          )
                            return;
                          setCandidateData({
                            ...candidateData,
                            credentials: {
                              ...candidateData.credentials,
                              seminarsAttended: [
                                ...candidateData.credentials.seminarsAttended,
                                {
                                  id: uuidv4(),
                                  name: "",
                                  startDate: null,
                                  endDate: null,
                                },
                              ],
                            },
                          });
                        }}
                        disabled={loading}
                        size="sm"
                      >
                        Add seminar added
                      </Button>
                    </Stack>
                  </FormControl>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </ModalBody>

          <ModalFooter justifyContent="space-between">
            <Box>
              {!deepEqual(candidateData, candidate) && (
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
                disabled={deepEqual(candidate, candidateData)}
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
