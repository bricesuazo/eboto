import {
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
import { useDocumentData } from "react-firebase-hooks/firestore";

import { electionType, voterType } from "../../../types/typings";
import DashboardLayout from "../../../layout/DashboardLayout";
import EditVoterModal from "../../../components/EditVoterModal";
import { firestore } from "../../../firebase/firebase";
import {
  doc,
  getDocs,
  query,
  where,
  collection,
  updateDoc,
  arrayRemove,
  setDoc,
} from "firebase/firestore";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
import DeleteVoterModal from "../../../components/DeleteVoterModal";

const VoterPage = ({ election }: { election: electionType }) => {
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
  const [votersData, votersDataLoading] = useDocumentData(
    doc(firestore, "elections", election.uid)
  );

  const [voters, setVoters] = useState<voterType[]>(votersData?.voters);
  const [selectedVoter, setSelectedVoter] = useState<voterType | null>(null);

  useEffect(() => {
    setVoters(votersData?.voters);
  }, [votersData, voters]);

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
      <DashboardLayout title="Voters">
        <InputGroup maxWidth={240} marginLeft="auto">
          <InputLeftElement
            pointerEvents="none"
            children={<MagnifyingGlassIcon color="gray.300" width={24} />}
          />
          <Input placeholder="Search..." />
        </InputGroup>
        {voters && voters.length !== 0 ? (
          <TableContainer height="100%" marginTop={4}>
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
                {voters?.map((voter) => (
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
                            isLoading={voter.loading}
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
          <Flex
            width="100%"
            height="100%"
            alignItems="center"
            justifyContent="center"
          >
            {votersDataLoading ? <Spinner /> : <Text>No voters yet.</Text>}
          </Flex>
        )}
      </DashboardLayout>
    </>
  );
};

export default VoterPage;

export const getServerSideProps: GetServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const electionSnapshot = await getDocs(
    query(
      collection(firestore, "elections"),
      where("electionIdName", "==", context.query.electionIdName)
    )
  );

  // const votersQuery = query(
  //   collection(firestore, "voters"),
  //   where("electionIdName", "==", electionIdName)
  // );
  // const votersSnapshot = await getDocs(votersQuery);
  // const votersData = votersSnapshot.docs.map((doc) => doc.data());

  return {
    props: {
      election: JSON.parse(JSON.stringify(electionSnapshot.docs[0].data())),
    },
  };
};
