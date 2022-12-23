import {
  Box,
  Button,
  ButtonGroup,
  Flex,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  HStack,
  Input,
  InputGroup,
  InputLeftAddon,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverFooter,
  PopoverHeader,
  PopoverTrigger,
  Select,
  Spinner,
  Stack,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { TrashIcon } from "@heroicons/react/24/outline";
import deepEqual from "deep-equal";
import {
  collection,
  doc,
  getDocs,
  query,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";
import type { GetServerSideProps, GetServerSidePropsContext } from "next";
import { getSession } from "next-auth/react";
import Head from "next/head";
import Image from "next/image";
import { useState } from "react";
import ReactDatePicker from "react-datepicker";
import slugify from "react-slugify";
import DeleteElectionModal from "../../../components/DeleteElectionModal";
import UploadElectionLogoModal from "../../../components/UploadElectionLogoModal";
import { firestore, storage } from "../../../firebase/firebase";
import DashboardLayout from "../../../layout/DashboardLayout";
import { adminType, electionType } from "../../../types/typings";
import isAdminOwnsTheElection from "../../../utils/isAdminOwnsTheElection";
import isElectionIdNameExists from "../../../utils/isElectionIdNameExists";
import isElectionOngoing from "../../../utils/isElectionOngoing";
import { getHourByNumber } from "../../../utils/getHourByNumber";

interface SettingsPageProps {
  election: electionType;
  session: { user: adminType; expires: string };
}
const SettingsPage = ({ election, session }: SettingsPageProps) => {
  const {
    isOpen: isOpenDelete,
    onOpen: onOpenDelete,
    onClose: onCloseDelete,
  } = useDisclosure();
  const {
    isOpen: isOpenLogo,
    onOpen: onOpenLogo,
    onClose: onCloseLogo,
  } = useDisclosure();
  const [initialElection, setInitialElection] =
    useState<electionType>(election);

  const initialState = {
    name: initialElection.name,
    electionIdName: initialElection.electionIdName,
    electionStartDate: initialElection.electionStartDate,
    electionEndDate: initialElection.electionEndDate,
    publicity: initialElection.publicity,
    logoUrl: initialElection.logoUrl,
    votingStartHour: initialElection.votingStartHour,
    votingEndHour: initialElection.votingEndHour,
  };

  const [settings, setSettings] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [loadingDeleteLogo, setLoadingDeleteLogo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(
    new Date(settings.electionStartDate?.seconds * 1000) || null
  );
  const [endDate, setEndDate] = useState<Date | null>(
    new Date(settings.electionEndDate?.seconds * 1000) || null
  );
  const {
    isOpen: isOpenPopover,
    onToggle: onTogglePopover,
    onClose: onClosePopover,
  } = useDisclosure();
  return (
    <>
      <UploadElectionLogoModal
        election={election}
        isOpen={isOpenLogo}
        onClose={onCloseLogo}
      />
      <DeleteElectionModal
        election={election}
        isOpen={isOpenDelete}
        onClose={onCloseDelete}
        session={session}
      />
      <Head>
        <title>Settings | eBoto Mo</title>
      </Head>
      <DashboardLayout title="Settings" session={session} overflow="auto">
        {!election ? (
          <Spinner />
        ) : (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setError(null);
              setLoading(true);

              if (
                !settings.name.trim() ||
                !settings.electionIdName.trim() ||
                !settings.electionStartDate ||
                !settings.electionEndDate ||
                !settings.publicity ||
                !startDate ||
                !endDate ||
                (startDate.toString() ===
                  new Date(
                    initialElection.electionStartDate.seconds * 1000
                  ).toString() &&
                  endDate.toString() ===
                    new Date(
                      initialElection.electionEndDate.seconds * 1000
                    ).toString() &&
                  deepEqual(settings, initialState))
              )
                return;

              const electionIdName =
                settings.electionIdName.charAt(
                  settings.electionIdName.length - 1
                ) === "-"
                  ? settings.electionIdName.slice(
                      0,
                      settings.electionIdName.length - 1
                    )
                  : settings.electionIdName;

              if (
                electionIdName.trim() !== initialElection.electionIdName.trim()
              ) {
                // Check if electionIdName is already taken
                if (await isElectionIdNameExists(electionIdName)) {
                  setError("Election ID Name is already taken");
                  setLoading(false);
                  return;
                }
              }

              await updateDoc(
                doc(firestore, "elections", initialElection.uid),
                {
                  ...settings,
                  electionIdName,
                  electionStartDate: Timestamp.fromDate(startDate),
                  electionEndDate: Timestamp.fromDate(endDate),
                  updatedAt: Timestamp.now(),
                }
              ).then(() => {
                setInitialElection({
                  ...initialElection,
                  ...settings,
                  electionStartDate: Timestamp.fromDate(startDate),
                  electionEndDate: Timestamp.fromDate(endDate),
                });
              });
              setLoading(false);
            }}
          >
            <Stack alignItems="flex-start" spacing={6}>
              <FormControl isRequired>
                <FormLabel>Election Name</FormLabel>
                <Input
                  placeholder={initialElection.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setSettings({
                      ...settings,
                      name: e.target.value,
                      electionIdName: slugify(e.target.value),
                    });
                  }}
                  value={settings.name}
                />
              </FormControl>
              <FormControl isRequired isInvalid={!!error}>
                <FormLabel>Election ID Name</FormLabel>
                <InputGroup borderColor={error ? "red.400" : ""}>
                  <InputLeftAddon pointerEvents="none" userSelect="none">
                    eboto-mo.com/
                  </InputLeftAddon>
                  <Input
                    placeholder={initialElection.electionIdName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setSettings({
                        ...settings,
                        electionIdName:
                          settings.electionIdName.charAt(
                            settings.electionIdName.length - 1
                          ) === "-"
                            ? e.target.value.trim()
                            : e.target.value.replace(" ", "-"),
                      });
                      setError(null);
                    }}
                    value={settings.electionIdName}
                  />
                </InputGroup>
                {error && <FormErrorMessage>{error}</FormErrorMessage>}
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Election Date</FormLabel>

                <ReactDatePicker
                  disabled={isElectionOngoing(initialElection)}
                  timeIntervals={60}
                  selected={startDate}
                  minDate={new Date()}
                  onChange={(date) => {
                    date ? setStartDate(date) : setStartDate(null);
                    setEndDate(null);
                  }}
                  filterTime={(time) => {
                    const currentDate = new Date();
                    const selectedDate = new Date(time);
                    return currentDate.getTime() < selectedDate.getTime();
                  }}
                  showTimeSelect
                  dateFormat="MMMM d, yyyy haa"
                  disabledKeyboardNavigation
                  withPortal
                  isClearable={!isElectionOngoing(initialElection)}
                  placeholderText="Select election start date"
                />
                <ReactDatePicker
                  disabled={!startDate || isElectionOngoing(initialElection)}
                  timeIntervals={60}
                  selected={endDate}
                  onChange={(date) => setEndDate(date)}
                  minDate={startDate}
                  filterTime={(time) => {
                    const selectedDate = new Date(time);
                    return startDate
                      ? startDate.getTime() < selectedDate.getTime()
                      : new Date().getTime() < selectedDate.getTime();
                  }}
                  showTimeSelect
                  dateFormat="MMMM d, yyyy haa"
                  disabledKeyboardNavigation
                  withPortal
                  isClearable={!isElectionOngoing(initialElection)}
                  placeholderText="Select election end date"
                  highlightDates={startDate ? [startDate] : []}
                />
                <FormHelperText>
                  You can&apos;t change the dates once the election is ongoing.
                </FormHelperText>
              </FormControl>

              <FormControl isRequired>
                <Stack>
                  <FormLabel>Voting Hours</FormLabel>
                  <HStack alignItems="center">
                    <Select
                      value={settings.votingStartHour}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          votingStartHour: parseInt(
                            e.target.value
                          ) as typeof settings.votingStartHour,
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
                      value={settings.votingEndHour}
                      onChange={(e) =>
                        setSettings({
                          ...election,
                          votingEndHour: parseInt(
                            e.target.value
                          ) as typeof election.votingEndHour,
                        })
                      }
                    >
                      {Array.from(Array(24).keys()).map((hour) => (
                        <option
                          value={hour}
                          key={hour}
                          disabled={election.votingStartHour >= hour}
                        >
                          {getHourByNumber(hour)}
                        </option>
                      ))}
                    </Select>
                  </HStack>
                  <Text textAlign="center">
                    {getHourByNumber(settings.votingStartHour)} -{" "}
                    {getHourByNumber(settings.votingEndHour)} (
                    {settings.votingEndHour - settings.votingStartHour < 0
                      ? settings.votingStartHour - settings.votingEndHour
                      : settings.votingEndHour - settings.votingStartHour}{" "}
                    {settings.votingEndHour - settings.votingStartHour > 1
                      ? "hours"
                      : "hour"}
                    )
                  </Text>
                </Stack>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Election Publicity</FormLabel>
                <Select
                  value={settings.publicity}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    setSettings({
                      ...settings,
                      publicity: e.target.value as
                        | "private"
                        | "voters"
                        | "public",
                    });
                  }}
                >
                  <option value="private">Private</option>
                  <option value="voters">Voters</option>
                  <option value="public">Public</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Logo</FormLabel>
                <HStack alignItems="center">
                  <Stack alignItems="center" spacing={0}>
                    <Box position="relative" width={24} height={24}>
                      <Image
                        src={
                          settings.logoUrl && settings.logoUrl.length
                            ? settings.logoUrl
                            : "/assets/images/default-election-logo.png"
                        }
                        alt="Election Logo"
                        style={{ objectFit: "cover" }}
                        fill
                      />
                    </Box>
                    {!(settings.logoUrl && settings.logoUrl.length) && (
                      <Text>No logo</Text>
                    )}
                  </Stack>

                  <Button variant="outline" onClick={onOpenLogo}>
                    Upload logo
                  </Button>
                  {election.logoUrl && election.logoUrl.length && (
                    <>
                      <Popover
                        isOpen={
                          loadingDeleteLogo ? loadingDeleteLogo : isOpenPopover
                        }
                        onClose={onClosePopover}
                        placement="left"
                      >
                        <PopoverTrigger>
                          <Button onClick={onTogglePopover}>Remove logo</Button>
                        </PopoverTrigger>
                        <PopoverContent>
                          <PopoverHeader fontWeight="semibold">
                            Confirm delete logo?
                          </PopoverHeader>
                          <PopoverArrow />
                          <PopoverCloseButton />
                          <PopoverBody>
                            Are you sure you want to delete the election&apos;s
                            logo?
                          </PopoverBody>
                          <PopoverFooter
                            display="flex"
                            justifyContent="flex-end"
                          >
                            <ButtonGroup size="sm">
                              <Button
                                disabled={loadingDeleteLogo}
                                variant="outline"
                                onClick={onClosePopover}
                              >
                                Cancel
                              </Button>
                              <Button
                                colorScheme="red"
                                isLoading={loadingDeleteLogo}
                                onClick={async () => {
                                  setLoadingDeleteLogo(true);
                                  await updateDoc(
                                    doc(firestore, "elections", election.uid),
                                    {
                                      logoUrl: "",
                                      updatedAt: Timestamp.now(),
                                    }
                                  ).then(async () => {
                                    await deleteObject(
                                      ref(
                                        storage,
                                        `elections/${election.uid}/photo`
                                      )
                                    );
                                  });
                                  setLoadingDeleteLogo(false);
                                }}
                              >
                                Delete
                              </Button>
                            </ButtonGroup>
                          </PopoverFooter>
                        </PopoverContent>
                      </Popover>
                    </>
                  )}
                </HStack>
              </FormControl>

              <Flex justifyContent="space-between" width="full">
                <Button
                  leftIcon={<TrashIcon width={16} />}
                  variant="outline"
                  color="red.400"
                  borderColor="red.400"
                  onClick={() => onOpenDelete()}
                >
                  Delete Election
                </Button>

                <Button
                  type="submit"
                  isLoading={loading}
                  disabled={
                    !settings.name.trim() ||
                    !settings.electionIdName.trim() ||
                    !settings.publicity ||
                    !startDate ||
                    !endDate ||
                    (startDate.toString() ===
                      new Date(
                        initialElection.electionStartDate.seconds * 1000
                      ).toString() &&
                      endDate.toString() ===
                        new Date(
                          initialElection.electionEndDate.seconds * 1000
                        ).toString() &&
                      settings.name.trim() === initialElection.name.trim() &&
                      settings.electionIdName.trim() ===
                        initialElection.electionIdName.trim() &&
                      settings.publicity === initialElection.publicity &&
                      settings.votingStartHour ===
                        initialElection.votingStartHour &&
                      settings.votingEndHour === initialElection.votingEndHour)
                  }
                >
                  Save
                </Button>
              </Flex>
            </Stack>
          </form>
        )}
      </DashboardLayout>
    </>
  );
};

export default SettingsPage;

export const getServerSideProps: GetServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const session = await getSession(context);
  const electionSnapshot = await getDocs(
    query(
      collection(firestore, "elections"),
      where("electionIdName", "==", context.query.electionIdName)
    )
  );
  if (electionSnapshot.empty || !session) {
    return {
      notFound: true,
    };
  }
  if (!isAdminOwnsTheElection(session, electionSnapshot.docs[0].id)) {
    return {
      redirect: {
        destination: "/dashboard",
        permanent: false,
      },
    };
  }
  if (electionSnapshot.docs.length === 0) {
    return {
      notFound: true,
    };
  } else {
    return {
      props: {
        session: await getSession(context),
        election: JSON.parse(JSON.stringify(electionSnapshot.docs[0].data())),
      },
    };
  }
};
