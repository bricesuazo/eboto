import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Alert,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  HStack,
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
  Select,
  Stack,
  Text,
  useRadio,
  useRadioGroup,
} from "@chakra-ui/react";
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { useSession } from "next-auth/react";
import Router from "next/router";
import { useEffect, useState } from "react";
import ReactDatePicker from "react-datepicker";
import slugify from "react-slugify";
import { v4 as uuidv4 } from "uuid";
import { firestore } from "../firebase/firebase";
import { electionType, partylistType } from "../types/typings";
import isElectionIdNameExists from "../utils/isElectionIdNameExists";
import reloadSession from "../utils/reloadSession";
import { getHourByNumber } from "../utils/getHourByNumber";

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
    uid: "",
    id: uuidv4(),
    name: "",
    about: null,
    electionIdName: "",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    electionStartDate: Timestamp.now(),
    electionEndDate: Timestamp.now(),
    publicity: "private",
    logoUrl: null,
    votingStartHour: 7,
    votingEndHour: 19,
  });
  const initialPartylist: partylistType = {
    uid: "",
    id: uuidv4(),
    name: "Independent",
    abbreviation: "IND",
    description: "",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{
    type: "electionIdName" | "electionDates";
    error: string;
  } | null>(null);
  const { data: session } = useSession();
  const now = new Date();

  now.setHours(now.getHours() + 1);
  now.setMinutes(0, 0, 0);

  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date | null>(null);

  const options = [
    { id: 0, title: "None", positions: [] },
    {
      id: 1,
      title: "CEIT-SC",
      positions: [
        "President",
        "Vice President for Internal Affairs",
        "Vice President for External Affairs",
        "Vice President for Documentation",
        "Vice President for Finance",
        "Vice President for Budget Management",
        "Vice President for Operations",
        "Vice President for Public Relations",
        "Gender and Development Representative ",
      ],
    },
    {
      id: 2,
      title: "CSSO",
      positions: [
        "President",
        "Vice President for Internal Affairs",
        "Vice President for External Affairs",
        "Secretary",
        "Treasurer",
        "Auditor",
        "Business Manager",
        "Public Relations Officer",
      ],
    },
    {
      id: 3,
      title: "CoESS-ICPEP",
      positions: [
        "President",
        "Vice President for Internal Affair",
        "Vice President for External Affair",
        "Secretary",
        "Assistant Secretary",
        "Treasurer",
        "Auditor",
        "Business Manager",
        "Public Relations Officer",
      ],
    },
    {
      id: 4,
      title: "IIEE",
      positions: [
        "President",
        "Vice President for Internal Affairs",
        "Vice President for External Affairs",
        "Vice President for Technical",
        "Secretary",
        "Assistant Secretary",
        "Treasurer",
        "Assistant Treasurer",
        "Auditor",
        "Public Relations Officer",
      ],
    },
    {
      id: 5,
      title: "PIIE",
      positions: [
        "President",
        "Vice President for Internal Affairs",
        "Vice President for External Affairs",
        "Vice President for Finance",
        "Vice President for Documentation",
        "Vice President for Academics and Research",
        "Vice President for Publication",
        "Vice President for Activities and Preparation",
        "Vice President for Communication",
        "Vice President for Marketing",
      ],
    },
  ];
  const [selectedTemplate, setSelectedTemplate] = useState<string>(
    options[0].id.toString()
  );
  const { getRootProps, getRadioProps } = useRadioGroup({
    name: "election-template",
    onChange: setSelectedTemplate,
    value: selectedTemplate,
  });
  const group = getRootProps();

  useEffect(() => {
    setElection({
      ...election,
      name: "",
      electionIdName: "",
      votingStartHour: 7,
      votingEndHour: 19,
    });
    setStartDate(new Date());
    setEndDate(null);
    setError(null);
    setSelectedTemplate(options[0].id.toString());
  }, [isOpen]);
  return (
    <Modal
      isOpen={cantClose ? true : isOpen}
      onClose={onClose}
      trapFocus={false}
    >
      <ModalOverlay />
      <ModalContent>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!startDate || !endDate) {
              setError({
                type: "electionDates",
                error: "Please select a start and end date for the election.",
              });
              return;
            }
            setError(null);
            setLoading(true);

            const electionIdName =
              election.electionIdName.charAt(
                election.electionIdName.length - 1
              ) === "-"
                ? election.electionIdName.slice(
                    0,
                    election.electionIdName.length - 1
                  )
                : election.electionIdName;
            // Check if electionIdName is already taken
            if (await isElectionIdNameExists(electionIdName)) {
              setError({
                type: "electionIdName",
                error: "Election ID Name is already taken",
              });
              setLoading(false);
              return;
            }

            await addDoc(collection(firestore, "elections"), {
              ...election,
              name: election.name.trim(),
              electionIdName,
              electionStartDate: Timestamp.fromDate(startDate),
              electionEndDate: Timestamp.fromDate(endDate),
            }).then(async (electionSnap) => {
              session?.user &&
                (await updateDoc(doc(firestore, "admins", session.user.uid), {
                  elections: arrayUnion(electionSnap.id),
                }));
              await updateDoc(doc(firestore, "elections", electionSnap.id), {
                uid: electionSnap.id,
              });
              await addDoc(
                collection(
                  firestore,
                  "elections",
                  electionSnap.id,
                  "partylists"
                ),
                initialPartylist
              ).then((partylistSnap) => {
                updateDoc(
                  doc(
                    firestore,
                    "elections",
                    electionSnap.id,
                    "partylists",
                    partylistSnap.id
                  ),
                  {
                    uid: partylistSnap.id,
                  }
                );
              });

              // CSSO template
              if (selectedTemplate !== "0") {
                const template = options.find(
                  (option) => option.id.toString() === selectedTemplate
                );
                template?.positions.forEach(async (position, i) => {
                  await addDoc(
                    collection(
                      firestore,
                      "elections",
                      electionSnap.id,
                      "positions"
                    ),
                    {
                      order: i,
                      uid: "",
                      id: uuidv4(),
                      title: position,
                      undecidedVotingCount: 0,
                      updatedAt: Timestamp.now(),
                      createdAt: Timestamp.now(),
                    }
                  ).then(async (positionSnap) => {
                    await updateDoc(
                      doc(
                        firestore,
                        "elections",
                        electionSnap.id,
                        "positions",
                        positionSnap.id
                      ),
                      {
                        uid: positionSnap.id,
                      }
                    );
                  });
                });
              }
            });
            setLoading(false);
            onClose();

            // reload session
            reloadSession();

            Router.push(`/${electionIdName}/dashboard`);
          }}
        >
          <ModalHeader>Create an election</ModalHeader>
          {!cantClose && <ModalCloseButton />}
          <ModalBody pb={6}>
            <Stack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Election Name</FormLabel>
                <Input
                  placeholder="Election Name"
                  onChange={(e) => {
                    setElection({
                      ...election,
                      name: e.target.value,
                      electionIdName: slugify(e.target.value),
                    });
                  }}
                  value={election.name}
                />
              </FormControl>

              <FormControl
                isRequired
                isInvalid={error?.type === "electionIdName"}
              >
                <FormLabel>Election ID Name</FormLabel>
                <InputGroup>
                  <InputLeftAddon>eboto-mo.com/</InputLeftAddon>
                  <Input
                    placeholder="Election ID"
                    onChange={(e) => {
                      setElection({
                        ...election,
                        electionIdName:
                          election.electionIdName.charAt(
                            election.electionIdName.length - 1
                          ) === "-"
                            ? e.target.value.trim()
                            : e.target.value.replace(" ", "-"),
                      });
                    }}
                    value={election.electionIdName}
                  />
                </InputGroup>
                {error?.type === "electionIdName" && (
                  <FormErrorMessage>{error.error}</FormErrorMessage>
                )}
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Election Date</FormLabel>
                <ReactDatePicker
                  selected={now}
                  minDate={now}
                  timeIntervals={60}
                  onChange={(date) => {
                    if (date) {
                      setStartDate(date);
                      setError(null);
                    } else {
                      setEndDate(null);
                    }
                  }}
                  filterTime={(time) => {
                    const currentDate = new Date();
                    const selectedDate = new Date(time);

                    return currentDate.getTime() < selectedDate.getTime();
                  }}
                  showTimeSelect
                  dateFormat="MMMM d, yyyy h:mm aa"
                  disabledKeyboardNavigation
                  withPortal
                  placeholderText="Select election start date"
                />
                <ReactDatePicker
                  disabled={!startDate}
                  selected={endDate}
                  timeIntervals={60}
                  onChange={(date) => {
                    setEndDate(date);
                    setError(null);
                  }}
                  minDate={startDate}
                  filterTime={(time) => {
                    const selectedDate = new Date(time);

                    return startDate
                      ? startDate.getTime() < selectedDate.getTime()
                      : new Date().getTime() < selectedDate.getTime();
                  }}
                  showTimeSelect
                  dateFormat="MMMM d, yyyy h:mm aa"
                  disabledKeyboardNavigation
                  withPortal
                  isClearable
                  placeholderText="Select election end date"
                  highlightDates={startDate ? [startDate] : []}
                />
                <FormHelperText>
                  You can&apos;t change the dates once the election is ongoing.
                </FormHelperText>
              </FormControl>
              {error?.type === "electionDates" && (
                <Alert status="error" marginTop={4}>
                  <AlertIcon />
                  <AlertTitle>{error?.error}</AlertTitle>
                </Alert>
              )}
              <FormControl isRequired>
                <FormLabel>Voting Hours</FormLabel>
                <Stack>
                  <HStack alignItems="center">
                    <Select
                      value={election.votingStartHour}
                      onChange={(e) =>
                        setElection({
                          ...election,
                          votingStartHour: parseInt(
                            e.target.value
                          ) as typeof election.votingStartHour,
                          votingEndHour: (parseInt(e.target.value) < 23
                            ? parseInt(e.target.value) + 1
                            : 0) as typeof election.votingEndHour,
                        })
                      }
                    >
                      {Array.from(Array(24).keys()).map((hour) => (
                        <option value={hour} key={hour}>
                          {getHourByNumber(hour)}
                        </option>
                      ))}
                    </Select>
                    <Select
                      value={election.votingEndHour}
                      onChange={(e) =>
                        setElection({
                          ...election,
                          votingEndHour: parseInt(
                            e.target.value
                          ) as typeof election.votingEndHour,
                        })
                      }
                    >
                      {Array.from(Array(24).keys()).map((hour) => (
                        <option
                          key={hour}
                          value={hour}
                          disabled={election.votingStartHour >= hour}
                        >
                          {getHourByNumber(hour)}
                        </option>
                      ))}
                    </Select>
                  </HStack>
                  <Text textAlign="center">
                    {getHourByNumber(election.votingStartHour)} -{" "}
                    {getHourByNumber(election.votingEndHour)} (
                    {election.votingEndHour - election.votingStartHour < 0
                      ? election.votingStartHour - election.votingEndHour
                      : election.votingEndHour - election.votingStartHour}{" "}
                    {election.votingEndHour - election.votingStartHour > 1
                      ? "hours"
                      : "hour"}
                    )
                  </Text>
                </Stack>
              </FormControl>
              <Accordion allowMultiple>
                <AccordionItem border="none">
                  <AccordionButton
                    px={0}
                    py={2}
                    _hover={{ backgroundColor: "transparent" }}
                  >
                    <Box flex="1" textAlign="left">
                      Election template
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                  <AccordionPanel padding={2}>
                    <Flex {...group} flexWrap="wrap" gap={2} userSelect="none">
                      {options.map((option) => {
                        const radio = getRadioProps({
                          value: option.id.toString(),
                        });
                        return (
                          <RadioCard key={option.id} {...radio}>
                            {option.title}
                          </RadioCard>
                        );
                      })}
                    </Flex>
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>
            </Stack>
          </ModalBody>
          <ModalFooter>
            {!cantClose && (
              <Button onClick={onClose} variant="ghost">
                Cancel
              </Button>
            )}
            <Button type="submit" ml={!cantClose ? 3 : 0} isLoading={loading}>
              Create
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};
function RadioCard(props: any) {
  const { getInputProps, getCheckboxProps } = useRadio(props);

  const input = getInputProps();
  const checkbox = getCheckboxProps();

  return (
    <Box as="label">
      <input {...input} />
      <Box
        {...checkbox}
        cursor="pointer"
        borderWidth="1px"
        borderRadius="md"
        boxShadow="md"
        _checked={{
          bg: "gray.600",
          color: "white",
          borderColor: "gray.600",
        }}
        _focus={{
          boxShadow: "outline",
        }}
        px={5}
        py={3}
      >
        {props.children}
      </Box>
    </Box>
  );
}

export default CreateElectionModal;
