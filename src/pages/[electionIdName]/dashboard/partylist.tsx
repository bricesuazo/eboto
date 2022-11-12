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
  Flex,
  useColorMode,
} from "@chakra-ui/react";
import { FlagIcon } from "@heroicons/react/24/outline";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  deleteDoc,
  orderBy,
} from "firebase/firestore";
import type {
  GetServerSideProps,
  GetServerSidePropsContext,
  NextPage,
} from "next";
import { Session } from "next-auth";
import { getSession } from "next-auth/react";
import Head from "next/head";
import { useEffect, useState } from "react";
import { useFirestoreCollectionData, useFirestoreDocData } from "reactfire";
import EditPartylistModal from "../../../components/EditPartylistModal";
import { firestore } from "../../../firebase/firebase";
import DashboardLayout from "../../../layout/DashboardLayout";
import { electionType, partylistType } from "../../../types/typings";
import dashboardRedirect from "../../../utils/dashboardRedirect";

const PartylistPage = ({
  election,
  session,
}: {
  election: electionType;
  session: Session;
}) => {
  const { data } = useFirestoreCollectionData(
    query(
      collection(firestore, "elections", election.uid, "partylists"),
      orderBy("createdAt")
    )
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
  const { colorMode } = useColorMode();
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
      <DashboardLayout title="Partylists" session={session}>
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
            <Flex gap={4} flexWrap="wrap">
              {partylists.map((partylist) => {
                return (
                  <div key={partylist.id}>
                    <Center
                      width={48}
                      height={64}
                      borderRadius="md"
                      cursor="pointer"
                      border="1px"
                      borderColor={`${
                        colorMode === "dark" ? "white" : "black"
                      }Alpha.300`}
                      padding={2}
                      pointerEvents={
                        partylist.abbreviation === "IND" ? "none" : "auto"
                      }
                      userSelect={
                        partylist.abbreviation === "IND" ? "none" : "auto"
                      }
                      color={
                        partylist.abbreviation === "IND"
                          ? `${
                              colorMode === "dark" ? "white" : "black"
                            }Alpha.500`
                          : "white"
                      }
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
                                  border: "2px solid gray.500",

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
                        <HStack
                          display={
                            partylist.abbreviation === "IND"
                              ? "none"
                              : "inherit"
                          }
                        >
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
                  </div>
                );
              })}
            </Flex>
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
  const redirect = await dashboardRedirect(context);
  if (redirect) {
    return redirect;
  }
  try {
    const electionSnapshot = await getDocs(
      query(
        collection(firestore, "elections"),
        where("electionIdName", "==", context.query.electionIdName)
      )
    );
    return {
      props: {
        session: await getSession(context),
        election: JSON.parse(JSON.stringify(electionSnapshot.docs[0].data())),
      },
    };
  } catch (err) {
    return {
      notFound: true,
    };
  }
};
