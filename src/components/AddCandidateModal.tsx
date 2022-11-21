import {
  Box,
  Button,
  Center,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
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
  useColorMode,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import {
  candidateType,
  electionType,
  partylistType,
  positionType,
} from "../types/typings";
import { v4 as uuidv4 } from "uuid";
import { TrashIcon } from "@heroicons/react/24/outline";
import {
  addDoc,
  collection,
  doc,
  updateDoc,
  Timestamp,
  getDocs,
  where,
  query,
} from "firebase/firestore";
import { firestore, storage } from "../firebase/firebase";
import capitalizeFirstLetter from "../utils/capitalizeFirstLetter";
import ReactDatePicker from "react-datepicker";
import slugify from "react-slugify";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import formatBytes from "../utils/formatBytes";
import compress from "../utils/imageCompressor";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";

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
  const { colorMode } = useColorMode();
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
      slug: "",

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
    slug: "",

    credentials: {
      achievements: [],
      affiliations: [],
      seminarsAttended: [],
    },
  });
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<{
    preview: string;
    name: string;
    size: number;
    file: File;
  } | null>(null);

  const [error, setError] = useState<{
    type: "slug";
    error: string;
  } | null>(null);
  const {
    getRootProps,
    getInputProps,
    isFocused,
    isDragAccept,
    isDragReject,
    open,
  } = useDropzone({
    autoFocus: true,
    multiple: false,
    accept: {
      "image/jpeg": [".jpeg", ".png"],
    },
    onDrop: (acceptedFiles) => {
      setImage(
        Object.assign(acceptedFiles[0], {
          preview: URL.createObjectURL(acceptedFiles[0]),
          file: acceptedFiles[0],
        })
      );
    },
  });

  useEffect(() => {
    clearForm();
    setLoading(false);
    setError(null);
    setImage(null);
  }, [isOpen]);
  return (
    <>
      <input {...getInputProps()} />
      <Modal isOpen={isOpen} onClose={onClose} trapFocus={false} size="2xl">
        <ModalOverlay />
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            setLoading(true);
            // Check if candidate's slug is already taken
            const slug =
              candidate.slug.charAt(candidate.slug.length - 1) === "-"
                ? candidate.slug.slice(0, candidate.slug.length - 1)
                : candidate.slug;

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

            await addDoc(
              collection(firestore, "elections", election.uid, "candidates"),
              {
                ...candidate,
                firstName: capitalizeFirstLetter(candidate.firstName),

                middleName: candidate.middleName
                  ? capitalizeFirstLetter(candidate.middleName)
                  : "",
                lastName: capitalizeFirstLetter(candidate.lastName),
                slug,
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

              // compress the image then upload
              if (image) {
                await compress(image.file).then(async (blob) => {
                  const storageRef = ref(
                    storage,
                    `elections/${election.uid}/candidates/${docRef.id}/photo`
                  );
                  const uploadTask = uploadBytesResumable(storageRef, blob);
                  uploadTask.on(
                    "state_changed",
                    (snapshot) => {
                      // const percent = Math.round(
                      //   (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                      // );
                      // update progress
                      // TODO: add progress bar
                      // setPercent(percent);
                    },
                    (err) => console.log(err),
                    () => {
                      // download url
                      getDownloadURL(uploadTask.snapshot.ref).then(
                        async (url) => {
                          await updateDoc(
                            doc(
                              firestore,
                              "elections",
                              election.uid,
                              "candidates",
                              docRef.id
                            ),
                            {
                              photoUrl: url,
                            }
                          );
                        }
                      );
                    }
                  );
                });
              }
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
                    <Stack spacing={4} flex={1}>
                      <FormControl isRequired>
                        <FormLabel>First name</FormLabel>
                        <Input
                          placeholder="Candidate first name"
                          onChange={(e) =>
                            setCandidate({
                              ...candidate,
                              firstName: e.target.value,
                              slug: slugify(
                                `${e.target.value.replace(
                                  " ",
                                  ""
                                )} ${candidate.middleName?.replace(
                                  " ",
                                  ""
                                )} ${candidate.lastName.replace(" ", "")}`
                              ),
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
                              slug: slugify(
                                `${candidate.firstName.replace(
                                  " ",
                                  ""
                                )} ${e.target.value.replace(
                                  " ",
                                  ""
                                )} ${candidate.lastName.replace(" ", "")}`
                              ),
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
                            setCandidate({
                              ...candidate,
                              lastName: e.target.value,
                              slug: slugify(
                                `${candidate.firstName.replace(
                                  " ",
                                  ""
                                )} ${candidate.middleName?.replace(
                                  " ",
                                  ""
                                )} ${e.target.value.replace(" ", "")}`
                              ),
                            })
                          }
                          value={candidate.lastName}
                          disabled={loading}
                        />
                      </FormControl>
                      <FormControl
                        isRequired
                        isInvalid={error?.type === "slug"}
                      >
                        <FormLabel>Slug</FormLabel>
                        <Input
                          placeholder="Candidate's slug"
                          onChange={(e) =>
                            setCandidate({
                              ...candidate,
                              slug:
                                candidate.slug.charAt(
                                  candidate.slug.length - 1
                                ) === "-"
                                  ? e.target.value.trim()
                                  : e.target.value.replace(" ", "-"),
                            })
                          }
                          value={candidate.slug}
                          disabled={loading}
                        />
                        {error?.type === "slug" && (
                          <FormErrorMessage>{error.error}</FormErrorMessage>
                        )}
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
                    </Stack>
                  </TabPanel>
                  <TabPanel>
                    <FormControl>
                      {image ? (
                        <HStack spacing={4}>
                          <Image
                            src={image.preview}
                            alt="test"
                            width={256}
                            height={256}
                          />
                          <Box>
                            <Text noOfLines={1} fontWeight="bold" fontSize="lg">
                              {image.name}
                            </Text>
                            <Text>{formatBytes(image.size)}</Text>
                            <Button onClick={() => setImage(null)} size="sm">
                              Delete
                            </Button>
                          </Box>
                        </HStack>
                      ) : (
                        <Center
                          height="64"
                          width="full"
                          p={4}
                          borderWidth={4}
                          borderColor={
                            isDragAccept
                              ? "green.500"
                              : isDragReject
                              ? "red.500"
                              : isFocused
                              ? "blue.500"
                              : colorMode === "light"
                              ? "gray.200"
                              : "gray.600"
                          }
                          borderStyle="dashed"
                          borderRadius="28px"
                          cursor="pointer"
                          userSelect="none"
                          onClick={open}
                          {...getRootProps({})}
                        >
                          <Text textAlign="center">
                            Drag/click the box to upload the candidate&apos;s
                            image.
                            <br />
                            (only accepts 1:1 ratio and .jpg, .jpeg, .png, .gif
                            types)
                          </Text>
                        </Center>
                      )}
                    </FormControl>
                  </TabPanel>
                  <TabPanel>
                    <FormControl>
                      <FormLabel>Achievements</FormLabel>

                      <Stack>
                        {!candidate.credentials.achievements.length ? (
                          <Text>No achievements added</Text>
                        ) : (
                          candidate.credentials.achievements.map(
                            (achievement) => (
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
                                    value={achievement.title}
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
                            )
                          )
                        )}
                        <Button
                          onClick={() => {
                            if (
                              candidate.credentials.achievements.length &&
                              candidate.credentials.achievements[
                                candidate.credentials.achievements.length - 1
                              ].title === ""
                            )
                              return;
                            setCandidate({
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
                        {!candidate.credentials.affiliations.length ? (
                          <Text>No affiliations added</Text>
                        ) : (
                          candidate.credentials.affiliations.map(
                            (affiliation) => (
                              <FormControl key={affiliation.id} isRequired>
                                <Stack>
                                  <Flex justifyContent="space-between" gap={2}>
                                    <Input
                                      placeholder="Organization name"
                                      onChange={(e) =>
                                        setCandidate({
                                          ...candidate,
                                          credentials: {
                                            ...candidate.credentials,
                                            affiliations:
                                              candidate.credentials.affiliations.map(
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
                                        setCandidate({
                                          ...candidate,
                                          credentials: {
                                            ...candidate.credentials,
                                            affiliations:
                                              candidate.credentials.affiliations.filter(
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
                                      setCandidate({
                                        ...candidate,
                                        credentials: {
                                          ...candidate.credentials,
                                          affiliations:
                                            candidate.credentials.affiliations.map(
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
                                        setCandidate({
                                          ...candidate,
                                          credentials: {
                                            ...candidate.credentials,
                                            affiliations:
                                              candidate.credentials.affiliations.map(
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
                                        setCandidate({
                                          ...candidate,
                                          credentials: {
                                            ...candidate.credentials,
                                            affiliations:
                                              candidate.credentials.affiliations.map(
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
                                      disabled={
                                        !affiliation.startDate?.toDate()
                                      }
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
                              candidate.credentials.affiliations.length &&
                              candidate.credentials.affiliations[
                                candidate.credentials.affiliations.length - 1
                              ].organizationName === "" &&
                              candidate.credentials.affiliations[
                                candidate.credentials.affiliations.length - 1
                              ].position === "" &&
                              !candidate.credentials.affiliations[
                                candidate.credentials.affiliations.length - 1
                              ].startDate &&
                              !candidate.credentials.affiliations[
                                candidate.credentials.affiliations.length - 1
                              ].endDate
                            )
                              return;
                            setCandidate({
                              ...candidate,
                              credentials: {
                                ...candidate.credentials,
                                affiliations: [
                                  ...candidate.credentials.affiliations,
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
                        {!candidate.credentials.seminarsAttended.length ? (
                          <Text>No seminars attended added</Text>
                        ) : (
                          candidate.credentials.seminarsAttended.map(
                            (seminarsAttended) => (
                              <FormControl key={seminarsAttended.id} isRequired>
                                <Flex justifyContent="space-between" gap={2}>
                                  <Input
                                    placeholder="Seminar attended title"
                                    onChange={(e) =>
                                      setCandidate({
                                        ...candidate,
                                        credentials: {
                                          ...candidate.credentials,
                                          seminarsAttended:
                                            candidate.credentials.seminarsAttended.map(
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
                                      setCandidate({
                                        ...candidate,
                                        credentials: {
                                          ...candidate.credentials,
                                          seminarsAttended:
                                            candidate.credentials.seminarsAttended.filter(
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
                                      setCandidate({
                                        ...candidate,
                                        credentials: {
                                          ...candidate.credentials,
                                          seminarsAttended:
                                            candidate.credentials.seminarsAttended.map(
                                              (seminarsAttendedToEdit) =>
                                                seminarsAttendedToEdit.id ===
                                                seminarsAttended.id
                                                  ? {
                                                      ...seminarsAttendedToEdit,
                                                      startDate:
                                                        Timestamp.fromDate(
                                                          date
                                                        ),
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
                                      setCandidate({
                                        ...candidate,
                                        credentials: {
                                          ...candidate.credentials,
                                          seminarsAttended:
                                            candidate.credentials.seminarsAttended.map(
                                              (seminarsAttendedToEdit) =>
                                                seminarsAttendedToEdit.id ===
                                                seminarsAttended.id
                                                  ? {
                                                      ...seminarsAttendedToEdit,
                                                      endDate:
                                                        Timestamp.fromDate(
                                                          date
                                                        ),
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
                            const lastSeminarAttended = candidate.credentials
                              .seminarsAttended[
                              candidate.credentials.seminarsAttended.length - 1
                            ]
                              ? candidate.credentials.seminarsAttended[
                                  candidate.credentials.seminarsAttended
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
                            setCandidate({
                              ...candidate,
                              credentials: {
                                ...candidate.credentials,
                                seminarsAttended: [
                                  ...candidate.credentials.seminarsAttended,
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
    </>
  );
};

export default AddCandidateModal;
