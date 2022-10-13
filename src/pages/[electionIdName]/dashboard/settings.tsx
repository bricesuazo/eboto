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
    name: initialElection?.name,
    electionIdName: initialElection?.electionIdName,
    ongoing: initialElection?.ongoing,
  };

  const [settings, setSettings] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

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
              if (
                (settings.name.trim() === initialElection.name.trim() &&
                  settings.electionIdName.trim() ===
                    initialElection.electionIdName.trim() &&
                  settings.ongoing === initialElection.ongoing) ||
                !settings.name.trim() ||
                !settings.electionIdName.trim()
              ) {
                return;
              }

              setLoading(true);
              await updateDoc(
                doc(firestore, "elections", initialElection.uid),
                settings
              ).then(() => {
                setInitialElection({ ...initialElection, ...settings });
                // setSettings({
                //   name: initialElection?.name,
                //   electionIdName: initialElection?.electionIdName,
                //   ongoing: initialElection?.ongoing,
                // });
              });
              setLoading(false);
            }}
          >
            <Stack alignItems="flex-start" spacing={6}>
              <FormControl>
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
              <FormControl>
                <FormLabel>Election ID Name</FormLabel>
                <InputGroup>
                  <InputLeftAddon children="eboto-mo.com/" />
                  <Input
                    placeholder={initialElection.electionIdName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setSettings({
                        ...settings,
                        electionIdName: e.target.value,
                      });
                    }}
                    value={settings.electionIdName}
                  />
                </InputGroup>
                <FormHelperText>
                  Election ID name must be unique.
                </FormHelperText>
              </FormControl>
              <FormControl
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <FormLabel htmlFor="toggle-election-ongoing" mb="0">
                  Election Ongoing
                </FormLabel>
                <Switch
                  id="toggle-election-ongoing"
                  size="lg"
                  isChecked={settings.ongoing}
                  onChange={(e) => {
                    setSettings({ ...settings, ongoing: e.target.checked });
                  }}
                />
              </FormControl>

              <Modal isOpen={isOpenDelete} onClose={onCloseDelete} isCentered>
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
                        session &&
                          (await updateDoc(
                            doc(firestore, "admins", session.user.uid),
                            {
                              elections: arrayRemove(election.uid),
                            }
                          ).then(async () => {
                            await deleteDoc(
                              doc(firestore, "elections", election.uid)
                            );
                          }));
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
                alignSelf="flex-end"
                disabled={
                  (settings.name.trim() === initialElection.name.trim() &&
                    settings.electionIdName.trim() ===
                      initialElection.electionIdName.trim() &&
                    settings.ongoing === initialElection.ongoing) ||
                  !settings.name.trim() ||
                  !settings.electionIdName.trim()
                }
              >
                Save
              </Button>
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
