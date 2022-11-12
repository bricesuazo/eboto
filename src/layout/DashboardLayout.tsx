import {
  Box,
  Button,
  Center,
  Divider,
  Flex,
  HStack,
  Icon,
  IconButton,
  Input,
  Select,
  Stack,
  Text,
  Tooltip,
  useColorMode,
  useDisclosure,
} from "@chakra-ui/react";
import { PlusIcon } from "@heroicons/react/24/solid";
import { collection, query, where } from "firebase/firestore";
import CreateElectionModal from "../components/CreateElectionModal";
import DashboardSidebar from "../components/DashboardSidebar";
import { firestore } from "../firebase/firebase";
import { useRouter } from "next/router";
import { useRouter as useRouterNavigation } from "next/navigation";
import AddVoterModal from "../components/AddVoterModal";
import { UserPlusIcon } from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";
import {
  ArrowPathIcon,
  ArrowUpOnSquareIcon,
} from "@heroicons/react/24/outline";
import { electionType } from "../types/typings";
import AddPartylistModal from "../components/AddPartylistModal";
import AddPositionModal from "../components/AddPositionModal";
import Moment from "react-moment";
import { Session } from "next-auth";
import { useFirestoreCollectionData } from "reactfire";
import UploadBulkVotersModal from "../components/UploadBulkVotersModal";

const DashboardLayout = ({
  children,
  title,
  overflow,
  session,
}: {
  children: any;
  title: string;
  overflow?: string;
  session: Session;
}) => {
  const router = useRouter();
  const routerNavigation = useRouterNavigation();
  // Reloads the page when router changes
  // useEffect(() => {
  //   currentElection?.electionIdName === router.query.electionIdName &&
  //     routerNavigation.refresh();
  // }, [router.query.electionIdName]);
  useEffect(() => {
    if (!session) {
      router.push("/signin");
      return;
    } else if (session.user.role === "voter") {
      router.push("/");
      return;
    }
  }, []);

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
    isOpen: isOpenAddVoter,
    onOpen: onOpenAddVoter,
    onClose: onCloseAddVoter,
  } = useDisclosure();
  const {
    isOpen: isOpenUploadBulkVoter,
    onOpen: onOpenUploadBulkVoter,
    onClose: onCloseUploadBulkVoter,
  } = useDisclosure();

  const [elections, setElections] = useState<electionType[]>();
  const [currentElection, setCurrentElection] = useState<electionType>();
  const { colorMode } = useColorMode();
  const { data } = useFirestoreCollectionData(
    query(
      collection(firestore, "elections"),
      where("uid", "in", session.user.elections)
    )
  );
  useEffect(() => {
    setElections(data as electionType[]);
  }, [data]);

  useEffect(() => {
    setCurrentElection(
      elections?.find(
        (election) => election.electionIdName === router.query.electionIdName
      )
    );
    if (elections?.length === 0) {
      router.push("/create-election");
    }
  }, [elections]);

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
      <UploadBulkVotersModal
        isOpen={isOpenUploadBulkVoter}
        onClose={onCloseUploadBulkVoter}
      />

      <Flex direction="column" gap={4} padding="4" height="85vh">
        <Stack direction="row" alignItems="center" spacing={4}>
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
                router.push(
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
          <Tooltip label="Last updated" hasArrow>
            <Stack
              direction="row"
              color={`${
                (colorMode === "dark" ? "white" : "black") + "Alpha.600"
              }`}
              p={2}
              cursor="pointer"
              role="group"
            >
              <Center gap={2}>
                <Icon
                  as={ArrowPathIcon}
                  _groupHover={{
                    color: `${
                      (colorMode === "dark" ? "white" : "black") + "Alpha.900"
                    }`,
                    transform: "rotate(180deg)",
                    transition: "all 0.5s",
                  }}
                />
                {!currentElection ? (
                  <Text fontSize="xs">Loading...</Text>
                ) : (
                  <Text
                    fontSize="xs"
                    _groupHover={{
                      color: `${
                        (colorMode === "dark" ? "white" : "black") + "Alpha.700"
                      }`,
                      transition: "all 0.5s",
                    }}
                  >
                    Updated{" "}
                    <Moment
                      interval={10000}
                      fromNow
                      date={currentElection.updatedAt.toDate()}
                    />
                  </Text>
                )}
              </Center>
            </Stack>
          </Tooltip>
        </Stack>

        <Flex borderRadius="0.25rem" gap={4} height="100%">
          <Box
            padding={4}
            backgroundColor={
              colorMode === "dark" ? "whiteAlpha.200" : "gray.100"
            }
            height="fit-content"
            width="248px"
            borderRadius="md"
          >
            <DashboardSidebar />
          </Box>

          <Stack
            padding={4}
            backgroundColor={
              colorMode === "dark" ? "whiteAlpha.200" : "gray.100"
            }
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
                  case "Voters":
                    return (
                      <HStack>
                        <Tooltip label="Upload bulk voters. (.xlsx)">
                          <IconButton
                            aria-label="Edit voter"
                            icon={<ArrowUpOnSquareIcon width={24} />}
                            onClick={onOpenUploadBulkVoter}
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
