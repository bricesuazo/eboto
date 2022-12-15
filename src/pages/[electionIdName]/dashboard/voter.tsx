import {
  Box,
  Center,
  Hide,
  HStack,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Spinner,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
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
            <TableContainer marginTop={4}>
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Hide below="md">
                      <Th>Full name</Th>
                    </Hide>
                    <Th>Email address</Th>
                    <Hide below="lg">
                      <Th>Password</Th>
                    </Hide>
                    <Hide below="xl">
                      <Th textAlign="center">Has voted?</Th>
                    </Hide>
                    <Th></Th>
                  </Tr>
                </Thead>

                <Tbody>
                  {voters.map((voter) => (
                    <Tr key={voter.id} _hover={{ backgroundColor: "gray.100" }}>
                      <Hide below="md">
                        <Td>{voter.fullName}</Td>
                      </Hide>
                      <Td>{voter.email}</Td>
                      <Hide below="lg">
                        <Td>{voter.password}</Td>
                      </Hide>
                      <Hide below="xl">
                        <Td textAlign="center">
                          {voter.hasVoted ? (
                            <Icon
                              as={CheckCircleIcon}
                              fontSize={24}
                              color="blue.300"
                            />
                          ) : (
                            <Icon
                              as={XCircleIcon}
                              fontSize={24}
                              color="red.300"
                            />
                          )}
                        </Td>
                      </Hide>
                      <Td>
                        <HStack justifyContent="flex-end">
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
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
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
