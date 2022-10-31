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
  Icon,
} from "@chakra-ui/react";
import {
  FlagIcon,
  UserCircleIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  deleteDoc,
  orderBy,
} from "firebase/firestore";
import type { GetServerSideProps, GetServerSidePropsContext } from "next";
import { Session } from "next-auth";
import { getSession } from "next-auth/react";
import Head from "next/head";
import { useEffect, useState } from "react";
import { useFirestoreCollectionData } from "reactfire";
import AddCandidateModal from "../../../components/AddCandidateModal";
import EditCandidateModal from "../../../components/EditCandidateModal";
import { firestore } from "../../../firebase/firebase";
import DashboardLayout from "../../../layout/DashboardLayout";
import {
  electionType,
  candidateType,
  partylistType,
  positionType,
} from "../../../types/typings";

const CandidatePage = ({
  election,
  partylists,
  positions,
  session,
}: {
  election: electionType;
  partylists: partylistType[];
  positions: positionType[];
  session: Session;
}) => {
  const { data } = useFirestoreCollectionData(
    collection(firestore, "elections", election.uid, "candidates")
  );
  const [candidates, setCandidates] = useState<candidateType[] | null>();
  const [selectedCandidate, setSelectedCandidate] = useState<candidateType>();
  useEffect(() => {
    data && setCandidates(data as candidateType[]);
  }, [data]);
  const {
    isOpen: isOpenEditCandidate,
    onOpen: onOpenEditCandidate,
    onClose: onCloseEditCandidate,
  } = useDisclosure();
  const {
    isOpen: isOpenAddCandidate,
    onOpen: onOpenAddCandidate,
    onClose: onCloseAddCandidate,
  } = useDisclosure();

  const [selectedPosition, setSelectedPosition] = useState<positionType>();
  const [deleteLoading, setDeleteLoading] = useState(false);
  return (
    <>
      <Head>
        <title>Candidates | eBoto Mo</title>
      </Head>
      {selectedPosition && (
        <AddCandidateModal
          isOpen={isOpenAddCandidate}
          onClose={onCloseAddCandidate}
          election={election}
          partylists={partylists}
          position={selectedPosition}
        />
      )}
      {selectedCandidate && (
        <EditCandidateModal
          isOpen={isOpenEditCandidate}
          onClose={onCloseEditCandidate}
          election={election}
          partylists={partylists}
          positions={positions}
          candidate={selectedCandidate}
        />
      )}
      <DashboardLayout title="Candidates" overflow="auto" session={session}>
        {!candidates ? (
          <Center>
            <Spinner />
          </Center>
        ) : (
          <Stack width="100%">
            {positions.map((position) => {
              return (
                <HStack key={position.id} spacing={4}>
                  <Text fontSize="lg" fontWeight="bold" width={32}>
                    {position.title}
                  </Text>
                  <Stack
                    alignItems="center"
                    width="fit-content"
                    textAlign="center"
                    border="1px solid"
                    borderColor="whiteAlpha.200"
                    paddingX={4}
                    paddingY={2}
                    borderRadius="lg"
                    cursor="pointer"
                    onClick={() => {
                      setSelectedPosition(position);
                      onOpenAddCandidate();
                    }}
                  >
                    <Icon as={UserPlusIcon} fontSize="xl" />
                    <Box>
                      <Text fontSize="xs">Add candidate in</Text>
                      <Text fontSize="sm">{position.title}</Text>
                    </Box>
                  </Stack>
                  <HStack overflowX="auto">
                    {candidates
                      .filter(
                        (candidate) => candidate.position === position.uid
                      )
                      .map((candidate) => {
                        return (
                          <Box
                            key={candidate.id}
                            display="inline-block"
                            height="full"
                            paddingX={4}
                            paddingY={2}
                            border="1px solid"
                            borderColor="whiteAlpha.200"
                            borderRadius="lg"
                          >
                            <Center position="relative">
                              {candidate.photoUrl ? (
                                <>
                                  <Image
                                    src={candidate.photoUrl}
                                    alt={
                                      candidate.firstName +
                                      " " +
                                      candidate.lastName +
                                      " photo"
                                    }
                                    width="54px"
                                    height="54px"
                                    borderRadius="full"
                                    objectFit="cover"
                                    fallback={<Spinner size="lg" />}
                                    userSelect="none"
                                    pointerEvents="none"
                                  />
                                </>
                              ) : (
                                <UserCircleIcon
                                  style={{
                                    width: 64,
                                    // padding: 12,
                                    borderRadius: "100%",
                                  }}
                                />
                              )}
                            </Center>
                            <Text>{`${candidate.lastName}, ${
                              candidate.firstName
                            }${
                              candidate.middleName &&
                              " " + candidate.middleName?.charAt(0) + "."
                            }`}</Text>
                            <HStack>
                              <Button
                                size="xs"
                                onClick={() => {
                                  setSelectedCandidate(candidate);
                                  onOpenEditCandidate();
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
                                          size="xs"
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
                                      <PopoverHeader fontSize="xs">
                                        Delete position?
                                      </PopoverHeader>
                                      <PopoverBody>
                                        <HStack>
                                          <Button
                                            onClick={onCloseDeleteModal}
                                            disabled={deleteLoading}
                                            size="xs"
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
                                                  "candidates",
                                                  candidate.uid
                                                )
                                              );
                                              onCloseDeleteModal();
                                              setDeleteLoading(false);
                                            }}
                                            isLoading={deleteLoading}
                                            colorScheme="red"
                                            size="xs"
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
                          </Box>
                        );
                      })}
                  </HStack>
                </HStack>
              );
            })}
          </Stack>
        )}
      </DashboardLayout>
    </>
  );
};

export default CandidatePage;

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
    if (electionSnapshot.empty) {
      return {
        notFound: true,
      };
    }

    const partylistSnapshot = await getDocs(
      query(
        collection(
          firestore,
          "elections",
          electionSnapshot.docs[0].data().uid,
          "partylists"
        ),
        orderBy("createdAt")
      )
    );
    const partylists: partylistType[] = partylistSnapshot.docs.map(
      (doc) => doc.data() as partylistType
    );

    const positionSnapshot = await getDocs(
      query(
        collection(
          firestore,
          "elections",
          electionSnapshot.docs[0].data().uid,
          "positions"
        ),
        orderBy("createdAt", "asc")
      )
    );
    const positions: positionType[] = positionSnapshot.docs.map(
      (doc) => doc.data() as positionType
    );

    return {
      props: {
        election: JSON.parse(JSON.stringify(electionSnapshot.docs[0].data())),
        partylists: JSON.parse(JSON.stringify(partylists)),
        positions: JSON.parse(JSON.stringify(positions)),
        session: await getSession(context),
      },
    };
  } catch (err) {
    return {
      notFound: true,
    };
  }
};
