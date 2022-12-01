import {
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
} from "@chakra-ui/react";
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
import EditPositionModal from "../../../components/EditPositionModal";
import { firestore } from "../../../firebase/firebase";
import DashboardLayout from "../../../layout/DashboardLayout";
import { adminType, electionType, positionType } from "../../../types/typings";

const PositionPage = ({
  election,
  session,
}: {
  election: electionType;
  session: { user: adminType; expires: string };
}) => {
  const { data } = useFirestoreCollectionData(
    query(
      collection(firestore, "elections", election.uid, "positions"),
      orderBy("order")
    )
  );
  const [positions, setPositions] = useState<positionType[] | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<positionType | null>(
    null
  );
  useEffect(() => {
    data && setPositions(data as positionType[]);
  }, [data]);
  const {
    isOpen: isOpenEditPosition,
    onOpen: onOpenEditPosition,
    onClose: onCloseEditPosition,
  } = useDisclosure();
  const [deleteLoading, setDeleteLoading] = useState(false);
  return (
    <>
      <Head>
        <title>Positions | eBoto Mo</title>
      </Head>
      {selectedPosition && (
        <EditPositionModal
          isOpen={isOpenEditPosition}
          onClose={onCloseEditPosition}
          election={election}
          position={selectedPosition}
        />
      )}
      <DashboardLayout title="Positions" overflow="auto" session={session}>
        {!positions ? (
          <Center>
            <Spinner />
          </Center>
        ) : positions.length === 0 ? (
          <Center>
            <Text>No positions</Text>
          </Center>
        ) : (
          <>
            <Flex flexWrap="wrap" gap="4">
              {positions.map((position) => {
                return (
                  <div key={position.id}>
                    <Center
                      width={48}
                      height={64}
                      borderRadius="md"
                      cursor="pointer"
                      border="1px"
                      borderColor="gray.300"
                      padding={2}
                    >
                      <Stack alignItems="center">
                        <Text textAlign="center">{position.title}</Text>
                        <HStack>
                          <Button
                            size="sm"
                            width="fit-content"
                            disabled={deleteLoading}
                            onClick={async () => {
                              setSelectedPosition(position);
                              onOpenEditPosition();
                            }}
                          >
                            Edit
                          </Button>
                          <Popover>
                            {({
                              onClose: onCloseDeleteModal,
                            }: {
                              onClose: () => void;
                            }) => (
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
                                    Delete position?
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
                                              "positions",
                                              position.uid
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

export default PositionPage;

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
