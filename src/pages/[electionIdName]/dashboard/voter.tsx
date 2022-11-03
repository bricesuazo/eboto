import {
  Center,
  Flex,
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
  Tfoot,
  Th,
  Thead,
  Tooltip,
  Tr,
  useDisclosure,
} from "@chakra-ui/react";
import {
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";
import Head from "next/head";
import { useEffect, useState } from "react";
import { electionType, voterType } from "../../../types/typings";
import DashboardLayout from "../../../layout/DashboardLayout";
import EditVoterModal from "../../../components/EditVoterModal";
import { firestore } from "../../../firebase/firebase";
import { getDocs, query, where, collection } from "firebase/firestore";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
import DeleteVoterModal from "../../../components/DeleteVoterModal";
import { useFirestoreCollectionData } from "reactfire";
import { getSession } from "next-auth/react";
import { Session } from "next-auth";

const VoterPage = ({
  election,
  session,
}: {
  election: electionType;
  session: Session;
}) => {
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
    collection(firestore, "elections", election.uid, "voters")
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
        <InputGroup maxWidth={240} marginLeft="auto">
          <InputLeftElement pointerEvents="none">
            <MagnifyingGlassIcon color="gray.300" width={24} />
          </InputLeftElement>
          <Input placeholder="Search..." />
        </InputGroup>
        {voters && voters.length !== 0 ? (
          <TableContainer height="full" marginTop={4}>
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th>Full name</Th>
                  <Th>Email address</Th>
                  <Th>Initial password</Th>
                  <Th textAlign="center">Has voted?</Th>
                  <Th></Th>
                </Tr>
              </Thead>

              <Tbody overflowY="auto">
                {voters.map((voter) => (
                  <Tr
                    key={voter.id}
                    _hover={{ backgroundColor: "whiteAlpha.100" }}
                  >
                    <Td>{voter.fullName}</Td>
                    <Td>{voter.email}</Td>
                    <Td>{voter.password}</Td>
                    <Td textAlign="center">
                      {voter.hasVoted ? (
                        <Icon
                          as={CheckCircleIcon}
                          fontSize={24}
                          color="blue.300"
                        />
                      ) : (
                        <Icon as={XCircleIcon} fontSize={24} color="red.300" />
                      )}
                    </Td>
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
              <Tfoot></Tfoot>
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
      </DashboardLayout>
    </>
  );
};

export default VoterPage;

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
