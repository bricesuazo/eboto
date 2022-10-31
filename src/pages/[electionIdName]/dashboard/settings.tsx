import {
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  InputGroup,
  InputLeftAddon,
  Spinner,
  Stack,
  Switch,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Text,
  Alert,
  AlertIcon,
  AlertTitle,
  Box,
  Flex,
  Select,
} from "@chakra-ui/react";
import {
  collection,
  query,
  where,
  updateDoc,
  doc,
  getDocs,
  deleteDoc,
  arrayRemove,
  writeBatch,
  runTransaction,
  Timestamp,
} from "firebase/firestore";
import type {
  GetServerSideProps,
  GetServerSidePropsContext,
  NextPage,
} from "next";
import Head from "next/head";
import { useState } from "react";
import { electionType } from "../../../types/typings";
import { firestore } from "../../../firebase/firebase";
import DashboardLayout from "../../../layout/DashboardLayout";
import { TrashIcon } from "@heroicons/react/24/outline";
import { useSession } from "next-auth/react";
import reloadSession from "../../../utils/reloadSession";
import isElectionIdNameExists from "../../../utils/isElectionIdNameExists";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface SettingsPageProps {
  election: electionType;
}
const SettingsPage = ({ election }: SettingsPageProps) => {
  const {
    isOpen: isOpenDelete,
    onOpen: onOpenDelete,
    onClose: onCloseDelete,
  } = useDisclosure();
  const [initialElection, setInitialElection] =
    useState<electionType>(election);
  const { data: session, status } = useSession();

  const initialState = {
    name: initialElection.name,
    electionIdName: initialElection.electionIdName,
    electionStartDate: initialElection.electionStartDate,
    electionEndDate: initialElection.electionEndDate,
    publicity: initialElection.publicity,
  };

  const [settings, setSettings] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [startDate, setStartDate] = useState<Date | null>(
    new Date(settings.electionStartDate?.seconds * 1000) || null
  );
  const [endDate, setEndDate] = useState<Date | null>(
    new Date(settings.electionEndDate?.seconds * 1000) || null
  );

  return (
    <>
      <Head>
        <title>Settings | eBoto Mo</title>
      </Head>
      <DashboardLayout title="Settings">
        {!election && status === "loading" ? (
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
                    initialElection.electionEndDate.seconds * 1000
                  ).toString() &&
                  endDate.toString() ===
                    new Date(
                      initialElection.electionEndDate.seconds * 1000
                    ).toString() &&
                  settings.name.trim() === initialElection.name.trim() &&
                  settings.electionIdName.trim() ===
                    initialElection.electionIdName.trim() &&
                  settings.publicity === initialElection.publicity)
              ) {
                return;
              }

              if (
                settings.electionIdName.trim() !==
                initialElection.electionIdName.trim()
              ) {
                // Check if electionIdName is already taken
                if (await isElectionIdNameExists(election.electionIdName)) {
                  setError("Election ID Name is already taken");
                  setLoading(false);
                  return;
                }
              }

              await updateDoc(
                doc(firestore, "elections", initialElection.uid),
                {
                  ...settings,
                  electionStartDate: Timestamp.fromDate(startDate),
                  electionEndDate: Timestamp.fromDate(endDate),
                  updatedAt: Timestamp.now(),
                }
              ).then(() => {
                setInitialElection({ ...initialElection, ...settings });
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
              <FormControl isRequired>
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
                        electionIdName: e.target.value,
                      });
                      setError(null);
                    }}
                    value={settings.electionIdName}
                  />
                </InputGroup>
                <FormHelperText>
                  Election ID name must be unique.
                </FormHelperText>
              </FormControl>
              {error && (
                <Alert status="warning" variant="left-accent">
                  <AlertIcon />
                  <AlertTitle>{error}</AlertTitle>
                </Alert>
              )}
              <FormControl isRequired>
                <FormLabel>Election Date</FormLabel>
                <DatePicker
                  selected={startDate}
                  onChange={(date) => {
                    date ? setStartDate(date) : setStartDate(null);
                    setEndDate(null);
                  }}
                  showTimeSelect
                  dateFormat="MMMM d, yyyy h:mm aa"
                  disabledKeyboardNavigation
                  withPortal
                  isClearable
                  placeholderText="Select election start date"
                />
                <DatePicker
                  selected={endDate}
                  onChange={(date) => setEndDate(date)}
                  minDate={startDate}
                  showTimeSelect
                  dateFormat="MMMM d, yyyy h:mm aa"
                  disabledKeyboardNavigation
                  withPortal
                  isClearable
                  disabled={!startDate}
                  placeholderText="Select election end date"
                  highlightDates={startDate ? [startDate] : []}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Election Publicity</FormLabel>
                <Select
                  placeholder="Publicity"
                  value={settings.publicity}
                  onChange={(e) => {
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

              <Modal isOpen={isOpenDelete} onClose={onCloseDelete}>
                <ModalOverlay />
                <ModalContent>
                  <ModalHeader>Delete {election.name}</ModalHeader>
                  <ModalCloseButton />
                  <ModalBody>
                    <Text>
                      Are you sure you want to delete this election? This
                      process cannot be undone.
                    </Text>
                  </ModalBody>

                  <ModalFooter>
                    <Button
                      mr={3}
                      onClick={onCloseDelete}
                      disabled={deleteLoading}
                    >
                      Close
                    </Button>
                    <Button
                      leftIcon={<TrashIcon width={16} />}
                      variant="outline"
                      color="red.400"
                      borderColor="red.400"
                      isLoading={deleteLoading}
                      onClick={async () => {
                        setDeleteLoading(true);

                        const batch = writeBatch(firestore);
                        session &&
                          batch.update(
                            doc(firestore, "admins", session.user.uid),
                            {
                              elections: arrayRemove(election.uid),
                            }
                          );
                        await batch.commit();

                        reloadSession();
                        onCloseDelete();
                        setDeleteLoading(false);
                      }}
                    >
                      Delete
                    </Button>
                  </ModalFooter>
                </ModalContent>
              </Modal>
              <Flex justifyContent="space-between" width="full">
                <Button
                  leftIcon={<TrashIcon width={16} />}
                  variant="outline"
                  color="red.400"
                  borderColor="red.400"
                  onClick={() => onOpenDelete()}
                  isLoading={status === "loading" && deleteLoading}
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
                    (settings.name.trim() === initialElection.name.trim() &&
                      settings.electionIdName.trim() ===
                        initialElection.electionIdName.trim() &&
                      settings.publicity === initialElection.publicity &&
                      startDate.toString() ===
                        new Date(
                          initialElection.electionStartDate.seconds * 1000
                        ).toString() &&
                      endDate.toString() ===
                        new Date(
                          initialElection.electionEndDate.seconds * 1000
                        ).toString())
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
  const electionQuery = query(
    collection(firestore, "elections"),
    where("electionIdName", "==", context.query.electionIdName)
  );
  const electionSnapshot = await getDocs(electionQuery);
  if (electionSnapshot.docs.length === 0) {
    return {
      notFound: true,
    };
  } else {
    return {
      props: {
        election: JSON.parse(JSON.stringify(electionSnapshot.docs[0].data())),
      },
    };
  }
  return { props: { electionIdName: context.query.electionIdName } };
};
