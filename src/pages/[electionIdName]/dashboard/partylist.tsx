import {
  Box,
  Button,
  Center,
  HStack,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Spinner,
  Stack,
  Text,
  useDisclosure,
  WrapItem,
  Image,
} from "@chakra-ui/react";
import { FlagIcon } from "@heroicons/react/24/outline";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  deleteDoc,
} from "firebase/firestore";
import type {
  GetServerSideProps,
  GetServerSidePropsContext,
  NextPage,
} from "next";
import Head from "next/head";
import { useEffect, useState } from "react";
import { useFirestoreCollectionData, useFirestoreDocData } from "reactfire";
import EditPartylistModal from "../../../components/EditPartylistModal";
import { firestore } from "../../../firebase/firebase";
import DashboardLayout from "../../../layout/DashboardLayout";
import { electionType, partylistType } from "../../../types/typings";

const PartylistPage = ({ election }: { election: electionType }) => {
  const { status, data } = useFirestoreCollectionData(
    collection(firestore, "elections", election.uid, "partylists")
  );
  const [partylists, setPartylists] = useState<partylistType[] | null>(null);
  const [selectedPartylist, setSelectedPartylist] =
    useState<partylistType | null>(null);
  useEffect(() => {
    data && setPartylists(data as partylistType[]);
  }, [data]);
  const {
    isOpen: isOpenEditPartylist,
    onOpen: onOpenEditPartylist,
    onClose: onCloseEditPartylist,
  } = useDisclosure();

  const [deleteLoading, setDeleteLoading] = useState(false);
  return (
    <>
      <Head>
        <title>Partylists | eBoto Mo</title>
      </Head>
      {selectedPartylist && (
        <EditPartylistModal
          isOpen={isOpenEditPartylist}
          onClose={onCloseEditPartylist}
          election={election}
          partylist={selectedPartylist}
        />
      )}
      <DashboardLayout title="Partylists">
        {!partylists ? (
          <Center>
            <Spinner />
          </Center>
        ) : partylists.length === 0 ? (
          <Center>
            <Text>No partylist</Text>
          </Center>
        ) : (
          <>
            <HStack spacing={4}>
              {partylists.map((partylist) => {
                return (
                  <>
                    <Center
                      width={48}
                      height={64}
                      borderRadius="md"
                      cursor="pointer"
                      border="1px"
                      borderColor="whiteAlpha.300"
                      key={partylist.id}
                      padding={2}
                    >
                      <Stack alignItems="center">
                        <Box
                          width={98}
                          height={98}
                          borderRadius="full"
                          overflow="hidden"
                        >
                          <Center height="100%" position="relative">
                            {partylist.logo ? (
                              <>
                                <Image
                                  src={partylist.logo}
                                  alt={partylist.name + " logo"}
                                  objectFit="cover"
                                  fallback={<Spinner size="lg" />}
                                  userSelect="none"
                                  pointerEvents="none"
                                />
                              </>
                            ) : (
                              <FlagIcon
                                style={{
                                  border: "2px solid gray",
                                  padding: 18,
                                  borderRadius: "100%",
                                }}
                              />
                            )}
                          </Center>
                        </Box>
                        <Text textAlign="center">
                          {partylist.name} ({partylist.abbreviation})
                        </Text>
                        <HStack>
                          <Button
                            size="sm"
                            width="fit-content"
                            disabled={deleteLoading}
                            onClick={async () => {
                              setSelectedPartylist(partylist);
                              onOpenEditPartylist();
                            }}
                          >
                            Edit
                          </Button>
                          <Popover>
                            {({ onClose: onCloseDeleteModal }) => (
                              <>
                                <PopoverTrigger>
                                  <WrapItem>
                                    <Button
                                      size="sm"
                                      width="fit-content"
                                      disabled={deleteLoading}
                                    >
                                      Delete
                                    </Button>
                                  </WrapItem>
                                </PopoverTrigger>
                                <PopoverContent width="100%">
                                  <PopoverArrow />
                                  <PopoverCloseButton />
                                  <PopoverHeader>
                                    Delete partylist?
                                  </PopoverHeader>
                                  <PopoverBody>
                                    <HStack>
                                      <Button
                                        onClick={onCloseDeleteModal}
                                        disabled={deleteLoading}
                                        size="sm"
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        onClick={async () => {
                                          setDeleteLoading(true);
                                          await deleteDoc(
                                            doc(
                                              firestore,
                                              "elections",
                                              election.uid,
                                              "partylists",
                                              partylist.uid
                                            )
                                          );
                                          onCloseDeleteModal();
                                          setDeleteLoading(false);
                                        }}
                                        isLoading={deleteLoading}
                                        colorScheme="red"
                                        size="sm"
                                      >
                                        Delete
                                      </Button>
                                    </HStack>
                                  </PopoverBody>
                                </PopoverContent>
                              </>
                            )}
                          </Popover>
                        </HStack>
                      </Stack>
                    </Center>
                  </>
                );
              })}
            </HStack>
          </>
        )}
      </DashboardLayout>
    </>
  );
};

export default PartylistPage;

export const getServerSideProps: GetServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  try {
    const electionSnapshot = await getDocs(
      query(
        collection(firestore, "elections"),
        where("electionIdName", "==", context.query.electionIdName)
      )
    );
    return {
      props: {
        election: JSON.parse(JSON.stringify(electionSnapshot.docs[0].data())),
      },
    };
  } catch (err) {
    return {
      notFound: true,
    };
  }
};
