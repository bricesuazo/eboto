import {
  Button,
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
  Tfoot,
  Th,
  Thead,
  Tooltip,
  Tr,
  useDisclosure,
} from "@chakra-ui/react";
import {
  ArrowUpOnSquareIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";
import { collection, getDocs, query, where } from "firebase/firestore";
import type { GetServerSidePropsContext, NextPage } from "next";
import Head from "next/head";
import { useEffect, useState } from "react";
import { useCollectionData } from "react-firebase-hooks/firestore";

import { electionType, voterType } from "../../../types/typings";
import { firestore } from "../../../firebase/firebase";
import DashboardLayout from "../../../layout/DashboardLayout";
import { useSWRConfig } from "swr";
import EditVoterModal from "../../../components/EditVoterModal";

const VoterPage = ({ election }: { election: electionType }) => {
  const { mutate } = useSWRConfig();
  const {
    isOpen: isOpenEditVoter,
    onOpen: onOpenEditVoter,
    onClose: onCloseEditVoter,
  } = useDisclosure();
  const [voters, setVoters] = useState<voterType[] | null>(null);
  const [selectedVoter, setSelectedVoter] = useState<voterType | null>(null);
  const [data] = useCollectionData(
    query(
      collection(firestore, "voters"),
      where("election", "==", election._id)
    )
  );

  useEffect(() => {
    data &&
      setVoters(data.map((obj) => ({ ...obj, loading: false })) as voterType[]);
  }, [data]);

  return (
    <>
      <Head>
        <title>Voters | eBoto Mo</title>
      </Head>
      {selectedVoter && (
        <EditVoterModal
          isOpen={isOpenEditVoter}
          onClose={onCloseEditVoter}
          selectedVoter={selectedVoter}
        />
      )}
      <DashboardLayout title="Voters">
        <InputGroup maxWidth={320} marginLeft="auto">
          <InputLeftElement
            pointerEvents="none"
            children={<MagnifyingGlassIcon color="gray.300" width={24} />}
          />
          <Input placeholder="Search..." />
        </InputGroup>
        <TableContainer height="100%">
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
                  key={voter.uid}
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
                          onClick={async () => {
                            // setting voters.loading = true
                            setVoters(
                              [...voters].map((object) => {
                                return object.uid === voter.uid
                                  ? {
                                      ...object,
                                      loading: true,
                                    }
                                  : object;
                              })
                            );
                            await mutate(
                              "/api/voter",
                              fetch("/api/voter", {
                                method: "DELETE",
                                body: JSON.stringify({
                                  voter: { uid: voter.uid },
                                }),
                              })
                            );
                            // setting voters.loading = false
                            setVoters(
                              [...voters].map((object) => {
                                return object.uid === voter.uid
                                  ? {
                                      ...object,
                                      loading: false,
                                    }
                                  : object;
                              })
                            );
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
                                (obj) => obj.uid === voter.uid
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
      </DashboardLayout>
    </>
  );
};

export default VoterPage;

export const getServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const electionIdName = context.query.electionIdName;
  const electionQuery = query(
    collection(firestore, "elections"),
    where("electionIdName", "==", electionIdName)
  );
  const electionSnapshot = await getDocs(electionQuery);

  // const votersQuery = query(
  //   collection(firestore, "voters"),
  //   where("electionIdName", "==", electionIdName)
  // );
  // const votersSnapshot = await getDocs(votersQuery);
  // const votersData = votersSnapshot.docs.map((doc) => doc.data());

  return {
    props: {
      election: JSON.parse(JSON.stringify(electionSnapshot.docs[0].data())),
      // voters: [],
    },
  };
};
