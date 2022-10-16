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
} from "@chakra-ui/react";
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
import { firestore } from "../../../firebase/firebase";
import DashboardLayout from "../../../layout/DashboardLayout";
import { electionType, partylistType } from "../../../types/typings";

const PartylistPage = ({ election }: { election: electionType }) => {
  const { status, data } = useFirestoreCollectionData(
    collection(firestore, "elections", election.uid, "partylists")
  );
  const [partylists, setPartylists] = useState<partylistType[] | null>(null);
  useEffect(() => {
    data && setPartylists(data as partylistType[]);
  }, [data]);

  const [deleteLoading, setDeleteLoading] = useState(false);
  return (
    <>
      <Head>
        <title>Partylists | eBoto Mo</title>
      </Head>

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
                  <Center
                    width={48}
                    height={64}
                    borderRadius="md"
                    cursor="pointer"
                    border="1px"
                    borderColor="whiteAlpha.300"
                  >
                    <Stack alignItems="center">
                      <Text textAlign="center">
                        {partylist.name} ({partylist.abbreviation})
                      </Text>
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
                              <PopoverHeader>Delete partylist?</PopoverHeader>
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
                    </Stack>
                  </Center>
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
