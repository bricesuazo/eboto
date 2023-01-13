import {
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputLeftAddon,
  Select,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  Textarea,
  useDisclosure,
} from "@chakra-ui/react";
import { TrashIcon } from "@heroicons/react/24/outline";
import deepEqual from "deep-equal";
import {
  Timestamp,
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import type { GetServerSideProps, GetServerSidePropsContext } from "next";
import { getSession } from "next-auth/react";
import Head from "next/head";
import Image from "next/image";
import { useState } from "react";
import ReactDatePicker from "react-datepicker";
import Moment from "react-moment";
import slugify from "react-slugify";
import DeleteElectionLogoModal from "../../../components/DeleteElectionLogoModal";
import DeleteElectionModal from "../../../components/DeleteElectionModal";
import UploadElectionLogoModal from "../../../components/UploadElectionLogoModal";
import { firestore } from "../../../firebase/firebase";
import DashboardLayout from "../../../layout/DashboardLayout";
import { adminType, electionType } from "../../../types/typings";
import { getHourByNumber } from "../../../utils/getHourByNumber";
import isAdminOwnsTheElection from "../../../utils/isAdminOwnsTheElection";
import isElectionIdNameExists from "../../../utils/isElectionIdNameExists";
import isElectionOngoing from "../../../utils/isElectionOngoing";

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
    about: initialElection.about,
  };

  const [settings, setSettings] = useState(initialState);
  const [loading, setLoading] = useState(false);
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
      <DeleteElectionLogoModal
        isOpen={isOpenPopover}
        onClose={onClosePopover}
        election={election}
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
                    });
                  }}
                  value={settings.name}
                />
              </FormControl>
              <FormControl isRequired isInvalid={!!error}>
                <FormLabel>Election ID Name</FormLabel>
                <InputGroup borderColor={error ? "red.400" : ""}>
                  <InputLeftAddon
                    pointerEvents="none"
                    userSelect="none"
                    display={["inherit", "none"]}
                  >
                    /
                  </InputLeftAddon>
                  <InputLeftAddon
                    pointerEvents="none"
                    userSelect="none"
                    display={["none", "inherit"]}
                  >
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

              <FormControl>
                <FormLabel>About</FormLabel>
                <Textarea
                  placeholder={`About ${initialElection.name}`}
                  rows={4}
                  value={settings.about!}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                    setSettings({
                      ...settings,
                      about: e.target.value,
                    });
                  }}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Election Date</FormLabel>
                <SimpleGrid
                  columns={[1, 2]}
                  spacing={2}
                  autoRows="auto"
                  alignItems="center"
                >
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
                    // isClearable={!isElectionOngoing(initialElection)}
                    customInput={
                      <Stack
                        spacing={0}
                        cursor="pointer"
                        border="1px"
                        borderColor="gray.200"
                        _hover={{ borderColor: "gray.500" }}
                        borderRadius={4}
                        padding={2}
                        textAlign="center"
                        justifyContent="center"
                        fontSize={[14, 16]}
                      >
                        {startDate ? (
                          <Moment
                            date={startDate}
                            format="MMMM D, YYYY h:mmA"
                          />
                        ) : (
                          <Text>Select election start date</Text>
                        )}
                      </Stack>
                    }
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
                    // isClearable={!isElectionOngoing(initialElection)}
                    highlightDates={startDate ? [startDate] : []}
                    customInput={
                      <Stack
                        spacing={0}
                        cursor="pointer"
                        border="1px"
                        borderColor="gray.200"
                        _hover={{ borderColor: "gray.500" }}
                        borderRadius={4}
                        padding={2}
                        textAlign="center"
                        justifyContent="center"
                        fontSize={[14, 16]}
                      >
                        {endDate ? (
                          <Moment date={endDate} format="MMMM D, YYYY h:mmA" />
                        ) : (
                          <Text>Select election end date</Text>
                        )}
                      </Stack>
                    }
                  />
                </SimpleGrid>
                <FormHelperText textAlign={["center", "left"]}>
                  You can&apos;t change the dates once the election is ongoing.
                </FormHelperText>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Voting Hours</FormLabel>
                <Stack>
                  <HStack alignItems="center">
                    <Select
                      value={settings.votingStartHour}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          votingStartHour: parseInt(
                            e.target.value
                          ) as typeof election.votingStartHour,
                          votingEndHour: (parseInt(e.target.value) < 23
                            ? parseInt(e.target.value) + 1
                            : 0) as typeof settings.votingEndHour,
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
                          ...settings,
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
                          disabled={settings.votingStartHour >= hour}
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
                <Stack direction={["column", "row"]} alignItems="center">
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
                    <Button onClick={onTogglePopover}>Remove logo</Button>
                  )}
                </Stack>
              </FormControl>

              <Flex justifyContent="space-between" width="full">
                <IconButton
                  display={["inherit", "none"]}
                  icon={<TrashIcon width={16} />}
                  aria-label="Icon"
                  color="red.400"
                  onClick={() => onOpenDelete()}
                />
                <Button
                  display={["none", "block"]}
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
                      settings.about?.trim() ===
                        initialElection.about?.trim() &&
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
