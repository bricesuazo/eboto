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
import type { GetServerSideProps, GetServerSidePropsContext } from "next";
import Head from "next/head";
import { useEffect, useState } from "react";
import { useFirestoreCollectionData } from "reactfire";
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
}: {
  election: electionType;
  partylists: partylistType[];
  positions: positionType[];
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
  const [deleteLoading, setDeleteLoading] = useState(false);
  return (
    <>
      <Head>
        <title>Candidates | eBoto Mo</title>
      </Head>
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
      <DashboardLayout title="Candidates">
        {!candidates ? (
          <Center>
            <Spinner />
          </Center>
        ) : candidates.length === 0 ? (
          <Center>
            <Text>No candidate</Text>
          </Center>
        ) : (
          <>
            <HStack spacing={4}>
              {candidates.map((candidate) => {
                return (
                  <div key={candidate.id}>
                    <Center
                      width={48}
                      height={64}
                      borderRadius="md"
                      cursor="pointer"
                      border="1px"
                      borderColor="whiteAlpha.300"
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
                            {candidate.photoUrl ? (
                              <>
                                <Image
                                  src={candidate.photoUrl}
                                  alt={
                                    candidate.firstName +
                                    candidate.lastName +
                                    " photo"
                                  }
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
                          {`${candidate.lastName}, ${candidate.firstName} ${
                            candidate.middleName
                              ? candidate.middleName.charAt(0) + "."
                              : ""
                          }`}
                        </Text>
                        <HStack>
                          <Button
                            size="sm"
                            width="fit-content"
                            disabled={deleteLoading}
                            onClick={async () => {
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
                                    Delete candidate?
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
                                              "candidates",
                                              candidate.uid
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
            </HStack>
          </>
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
