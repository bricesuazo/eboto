import {
  Box,
  Center,
  Flex,
  HStack,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Spinner,
  Text,
  Tooltip,
  useColorMode,
  useDisclosure,
} from "@chakra-ui/react";
import {
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { getSession } from "next-auth/react";
import Head from "next/head";
import { useEffect, useState } from "react";
import { useFirestoreCollectionData } from "reactfire";
import DeleteVoterModal from "../../../components/DeleteVoterModal";
import EditVoterModal from "../../../components/EditVoterModal";
import { firestore } from "../../../firebase/firebase";
import DashboardLayout from "../../../layout/DashboardLayout";
import { adminType, electionType, voterType } from "../../../types/typings";
import isAdminOwnsTheElection from "../../../utils/isAdminOwnsTheElection";

const VoterPage = ({
  election,
  session,
}: {
  election: electionType;
  session: { user: adminType; expires: string };
}) => {
  const { colorMode } = useColorMode();
  const {
    isOpen: isOpenEditVoter,
    onOpen: onOpenEditVoter,
    onClose: onCloseEditVoter,
  } = useDisclosure();
  const {
    isOpen: isOpenDeleteVoter,
    onOpen: onOpenDeleteVoter,
    onClose: onCloseDeleteVoter,
  } = useDisclosure();

  const { status: votersStatus, data: votersData } = useFirestoreCollectionData(
    query(
      collection(firestore, "elections", election.uid, "voters"),
      orderBy("createdAt", "asc")
    )
  );
  const [voters, setVoters] = useState<voterType[]>([]);
  const [selectedVoter, setSelectedVoter] = useState<voterType | null>(null);

  useEffect(() => {
    setVoters(votersData as voterType[]);
  }, [votersData]);
  return (
    <>
      <Head>
        <title>Voters | eBoto Mo</title>
      </Head>
      {selectedVoter && (
        <DeleteVoterModal
          isOpen={isOpenDeleteVoter}
          onClose={onCloseDeleteVoter}
          selectedVoter={selectedVoter}
        />
      )}
      {selectedVoter && (
        <EditVoterModal
          isOpen={isOpenEditVoter}
          onClose={onCloseEditVoter}
          selectedVoter={selectedVoter}
        />
      )}
      <DashboardLayout title="Voters" session={session}>
        <Box width="full" height="full" overflowX="hidden">
          <InputGroup width={["full", 248]} marginLeft="auto">
            <InputLeftElement pointerEvents="none">
              <MagnifyingGlassIcon color="gray.300" width={24} />
            </InputLeftElement>
            <Input placeholder="Search..." />
          </InputGroup>
          {voters && voters.length !== 0 ? (
            <Box marginTop={4}>
              <Flex
                alignItems="center"
                justifyContent="space-between"
                fontSize="sm"
                fontWeight="semibold"
                paddingX={4}
                paddingY={2}
              >
                <Text display={["none", "none", "block"]} width="32">
                  Full name
                </Text>

                <Text width="44">Email address</Text>

                <Text display={["none", "none", "none", "block"]} width="36">
                  Password
                </Text>

                <Text
                  textAlign="center"
                  display={["none", "none", "none", "none", "block"]}
                  width="20"
                >
                  Has voted?
                </Text>

                <Box width="16" />
              </Flex>

              <Box>
                {voters.map((voter) => (
                  <Flex
                    key={voter.id}
                    _hover={{ backgroundColor: "gray.100" }}
                    alignItems="center"
                    justifyContent="space-between"
                    paddingX={4}
                    paddingY={2}
                    fontSize="sm"
                  >
                    <Text display={["none", "none", "block"]} width="32">
                      {voter.fullName}
                    </Text>

                    <Text width="44">{voter.email}</Text>

                    <Text
                      display={["none", "none", "none", "block"]}
                      width="36"
                    >
                      {voter.password}
                    </Text>

                    <Box
                      display={["none", "none", "none", "none", "flex"]}
                      width="20"
                      justifyContent="center"
                      alignItems="center"
                    >
                      {voter.hasVoted ? (
                        <Icon
                          as={CheckCircleIcon}
                          fontSize={24}
                          color="blue.300"
                        />
                      ) : (
                        <Icon as={XCircleIcon} fontSize={24} color="red.300" />
                      )}
                    </Box>

                    <Box>
                      <HStack justifyContent="flex-end">
                        <Box display={["none", "initial"]}>
                          <Tooltip label="Delete voter">
                            <IconButton
                              aria-label="Delete voter"
                              icon={<TrashIcon width={18} />}
                              size="sm"
                              color="red.300"
                              onClick={() => {
                                setSelectedVoter(
                                  voters.find(
                                    (obj) => obj.id === voter.id
                                  ) as voterType
                                );
                                onOpenDeleteVoter();
                              }}
                            />
                          </Tooltip>
                        </Box>
                        <Tooltip label="Edit voter">
                          <IconButton
                            aria-label="Edit voter"
                            icon={<PencilSquareIcon width={18} />}
                            size="sm"
                            onClick={() => {
                              setSelectedVoter(
                                voters.find(
                                  (obj) => obj.id === voter.id
                                ) as voterType
                              );
                              onOpenEditVoter();
                            }}
                          />
                        </Tooltip>
                      </HStack>
                    </Box>
                  </Flex>
                ))}
              </Box>
            </Box>
          ) : (
            <Center width="full" height="full">
              {votersStatus === "loading" ? (
                <Spinner />
              ) : (
                <Text>No voters yet.</Text>
              )}
            </Center>
          )}
        </Box>
      </DashboardLayout>
    </>
  );
};

export default VoterPage;

export const getServerSideProps: GetServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  try {
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
