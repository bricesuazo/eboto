import {
  Box,
  Button,
  Center,
  Divider,
  Flex,
  HStack,
  IconButton,
  Input,
  Select,
  Stack,
  Text,
  Tooltip,
  useDisclosure,
} from "@chakra-ui/react";
import { PlusIcon } from "@heroicons/react/24/solid";
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import CreateElectionModal from "../components/CreateElectionModal";
import DashboardSidebar from "../components/DashboardSidebar";
import { firestore } from "../firebase/firebase";
import Router, { useRouter } from "next/router";
import AddVoterModal from "../components/AddVoterModal";
import { UserPlusIcon } from "@heroicons/react/24/solid";
import { useEffect, useRef, useState } from "react";
import { ArrowUpOnSquareIcon } from "@heroicons/react/24/outline";
import { electionType } from "../types/typings";
import { useSession } from "next-auth/react";
import AddPartylistModal from "../components/AddPartylistModal";
import AddPositionModal from "../components/AddPositionModal";
import AddCandidateModal from "../components/AddCandidateModal";

const DashboardLayout = ({
  children,
  title,
  overflow,
}: {
  children: any;
  title: string;
  overflow?: string;
}) => {
  const { data: session } = useSession();
  const {
    isOpen: isOpenCreateElection,
    onOpen: onOpenCreateElection,
    onClose: onCloseCreateElection,
  } = useDisclosure();
  const {
    isOpen: isOpenAddPartylist,
    onOpen: onOpenAddPartylist,
    onClose: onCloseAddPartylist,
  } = useDisclosure();
  const {
    isOpen: isOpenAddPosition,
    onOpen: onOpenAddPosition,
    onClose: onCloseAddPosition,
  } = useDisclosure();
  const {
    isOpen: isOpenAddCandidate,
    onOpen: onOpenAddCandidate,
    onClose: onCloseAddCandidate,
  } = useDisclosure();
  const {
    isOpen: isOpenAddVoter,
    onOpen: onOpenAddVoter,
    onClose: onCloseAddVoter,
  } = useDisclosure();

  const [elections, setElections] = useState<electionType[]>();
  const [currentElection, setCurrentElection] = useState<electionType>();

  useEffect(() => {
    if (session && session.user && session.user.elections.length !== 0) {
      onSnapshot(
        query(
          collection(firestore, "elections"),
          where("uid", "in", session.user.elections)
        ),
        (querySnapshot) => {
          const docData: electionType[] = [];
          querySnapshot.forEach((doc) => {
            docData.push(doc.data() as electionType);
          });
          setElections(docData);
        }
      );
    }
  }, [session]);

  // useEffect(() => {
  //   if (isOpenAddCandidate && currentElection) {
  //     const getData = async () => {
  //       // await getDocs(
  //       //   collection(firestore, "elections", currentElection.uid, "partylists")
  //       // ).then((querySnapshot) => {
  //       //   const docData: partylistType[] = [];
  //       //   querySnapshot.forEach((doc) => {
  //       //     docData.push(doc.data() as partylistType);
  //       //   });
  //       //   setPartylists(docData);
  //       // });
  //       // await getDocs(
  //       //   collection(firestore, "elections", currentElection.uid, "positions")
  //       // ).then((querySnapshot) => {
  //       //   const docData: positionType[] = [];
  //       //   querySnapshot.forEach((doc) => {
  //       //     docData.push(doc.data() as positionType);
  //       //   });
  //       //   setPositions(docData);
  //       // });
  //     };
  //     getData();
  //   }
  // }, [isOpenAddCandidate]);

  useEffect(() => {
    setCurrentElection(
      elections?.find(
        (election) => election.electionIdName === router.query.electionIdName
      )
    );
  }, [elections]);

  const router = useRouter();

  const fileRef = useRef<HTMLInputElement | null>(null);

  return (
    <>
      <CreateElectionModal
        isOpen={isOpenCreateElection}
        onClose={onCloseCreateElection}
      />
      <AddPartylistModal
        election={currentElection as electionType}
        isOpen={isOpenAddPartylist}
        onClose={onCloseAddPartylist}
      />
      <AddPositionModal
        election={currentElection as electionType}
        isOpen={isOpenAddPosition}
        onClose={onCloseAddPosition}
      />

      <AddVoterModal
        election={currentElection as electionType}
        isOpen={isOpenAddVoter}
        onClose={onCloseAddVoter}
      />

      <Flex direction="column" gap={4} padding="4" height="85vh">
        <Center columnGap={2} width="248px">
          <Select
            placeholder={
              false
                ? !elections?.length
                  ? "Loading..."
                  : "Create election"
                : undefined
            }
            disabled={!elections?.length}
            value={router.query.electionIdName}
            onChange={(e) => {
              Router.push(
                "/" +
                  e.target.value +
                  router.pathname.split("/[electionIdName]")[1]
              );
            }}
          >
            {elections?.map((election) => (
              <option value={election.electionIdName} key={election.id}>
                {election.name}
              </option>
            ))}
          </Select>
          <Tooltip label="Create an election">
            <IconButton
              aria-label="Add election"
              icon={<PlusIcon width="1.5rem" />}
              onClick={onOpenCreateElection}
            />
          </Tooltip>
        </Center>

        <Flex borderRadius="0.25rem" gap={4} height="100%">
          <Box
            padding={4}
            backgroundColor="whiteAlpha.200"
            height="fit-content"
            width="248px"
            borderRadius="md"
          >
            <DashboardSidebar />
          </Box>

          <Stack
            padding={4}
            backgroundColor="whiteAlpha.200"
            height="100%"
            flex="1"
            borderRadius="md"
          >
            <Flex justifyContent="space-between">
              <Text fontSize="2xl" fontWeight="bold">
                {title}
              </Text>
              {(() => {
                switch (title) {
                  case "Partylists":
                    return (
                      <HStack>
                        <Button
                          onClick={onOpenAddPartylist}
                          leftIcon={<UserPlusIcon width={18} />}
                          isLoading={!currentElection}
                        >
                          Add partylist
                        </Button>
                      </HStack>
                    );
                  case "Positions":
                    return (
                      <HStack>
                        <Button
                          onClick={onOpenAddPosition}
                          leftIcon={<UserPlusIcon width={18} />}
                          isLoading={!currentElection}
                        >
                          Add position
                        </Button>
                      </HStack>
                    );
                  // case "Candidates":
                  //   return (
                  //     <HStack>
                  //       <Button
                  //         onClick={onOpenAddCandidate}
                  //         leftIcon={<UserPlusIcon width={18} />}
                  //         isLoading={!currentElection}
                  //       >
                  //         Add candidate
                  //       </Button>
                  //     </HStack>
                  //   );
                  case "Voters":
                    return (
                      <HStack>
                        <Input
                          type="file"
                          hidden
                          accept=".csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                          ref={fileRef}
                        />
                        <Tooltip label="Upload bulk voters. (.csv, .xls, .xlsx)">
                          <IconButton
                            aria-label="Edit voter"
                            icon={<ArrowUpOnSquareIcon width={24} />}
                            onClick={() => fileRef?.current?.click()}
                          />
                        </Tooltip>
                        <Button
                          onClick={onOpenAddVoter}
                          leftIcon={<UserPlusIcon width={18} />}
                          isLoading={!currentElection}
                        >
                          Add voter
                        </Button>
                      </HStack>
                    );
                }
              })()}
            </Flex>

            <Divider />
            <Box paddingTop={2} overflow={overflow}>
              {children}
            </Box>
          </Stack>
        </Flex>
      </Flex>
    </>
  );
};

export default DashboardLayout;
